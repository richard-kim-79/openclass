import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';

const prisma = new PrismaClient();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

// AI 검색 옵션 인터페이스 (간소화)
export interface AISearchOptions {
  query: string;
  type?: 'FILE' | 'POST' | 'COURSE' | 'ALL';
  limit?: number;
  includeAISummary?: boolean;
  userId?: string;
}

// 검색 결과 인터페이스 (간소화)
export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  type: 'FILE' | 'POST' | 'COURSE';
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  relevanceScore: number;
  aiSummary?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

// AI 검색 서비스 클래스 (효율적인 Fallback 방식)
export class AISearchService {
  private readonly MAX_CONTENT_LENGTH = 1500;
  
  /**
   * 효율적인 검색 전략:
   * 1순위: 빠른 키워드 검색
   * 2순위: 결과 부족시 의미 검색 (고비용)
   */
  async search(options: AISearchOptions): Promise<SearchResult[]> {
    const startTime = Date.now();
    
    try {
      logger.info('검색 시작', { query: options.query, type: options.type });

      // 1. 캐시 확인
      const cacheKey = this.generateCacheKey(options);
      const cachedResults = cacheService.get<SearchResult[]>('queries', cacheKey);
      
      if (cachedResults) {
        logger.info('캐시에서 검색 결과 반환', { 
          query: options.query, 
          resultCount: cachedResults.length 
        });
        return cachedResults;
      }

      // 2. 1순위: 빠른 키워드 검색
      logger.info('1단계: 키워드 검색 실행');
      const keywordResults = await this.performKeywordSearch(options);
      
      let finalResults = keywordResults;
      let searchMethod = 'keyword';

      // 3. 키워드 검색 결과가 부족하면 의미 검색 실행
      if (keywordResults.length < 3) {
        logger.info('키워드 검색 결과 부족, 2단계: 의미 검색 실행');
        const semanticResults = await this.performSemanticSearch(options);
        
        // 키워드 결과를 우선하고, 의미 검색 결과를 추가
        const combinedResults = [...keywordResults];
        
        // 중복 제거하면서 의미 검색 결과 추가
        semanticResults.forEach(semanticResult => {
          const isDuplicate = keywordResults.some(keywordResult => 
            keywordResult.id === semanticResult.id
          );
          if (!isDuplicate) {
            combinedResults.push(semanticResult);
          }
        });
        
        finalResults = combinedResults;
        searchMethod = 'hybrid';
      }
      
      // 4. OpenAI를 사용한 관련성 점수 향상 (선택적)
      if (this.isOpenAIAvailable() && finalResults.length > 0) {
        await this.enhanceWithAIRelevance(options.query, finalResults);
      }
      
      // 5. AI 요약 생성 (요청된 경우)
      if (options.includeAISummary && this.isOpenAIAvailable()) {
        await this.addAISummaries(finalResults);
      }
      
      // 6. 관련성 점수 기준으로 정렬 및 제한
      const sortedResults = finalResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, options.limit || 10);

      // 7. 캐시에 저장
      if (sortedResults.length > 0) {
        cacheService.set('queries', cacheKey, sortedResults, 30);
      }

      // 8. 검색 기록 저장
      await this.saveSearchHistory(options);

      const processingTime = Date.now() - startTime;
      logger.info('검색 완료', { 
        query: options.query, 
        resultCount: sortedResults.length,
        processingTime: `${processingTime}ms`,
        method: searchMethod
      });

      return sortedResults;
      
    } catch (error) {
      logger.error('검색 오류:', error);
      
      // 에러 시 기본 검색으로 폴백
      const fallbackResults = await this.performKeywordSearch(options);
      return fallbackResults.slice(0, options.limit || 10);
    }
  }

  /**
   * 1순위: 빠른 키워드 검색
   */
  private async performKeywordSearch(options: AISearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      const query = options.query.toLowerCase().trim();
      const searchCondition = {
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { content: { contains: query, mode: 'insensitive' as const } },
          { tags: { contains: query, mode: 'insensitive' as const } }
        ]
      };

      const promises = [];

      // 게시물 검색
      if (options.type === 'POST' || options.type === 'ALL') {
        promises.push(
          prisma.post.findMany({
            where: searchCondition,
            include: {
              author: { select: { id: true, name: true, avatarUrl: true } }
            },
            take: 10,
            orderBy: [{ updatedAt: 'desc' }]
          }).then(posts => 
            posts.map(post => ({
              id: post.id,
              title: post.title,
              content: post.content || undefined,
              type: 'POST' as const,
              author: post.author ? {
                id: post.author.id,
                name: post.author.name,
                avatarUrl: post.author.avatarUrl || undefined
              } : undefined,
              tags: this.parseTags(post.tags),
              relevanceScore: this.calculateKeywordRelevance(query, post.title, post.content),
              url: `/posts/${post.id}`,
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString()
            }))
          )
        );
      }

      // 파일 검색
      if (options.type === 'FILE' || options.type === 'ALL') {
        promises.push(
          prisma.file.findMany({
            where: {
              OR: [
                { title: { contains: query } },
                { description: { contains: query } },
                { tags: { contains: query } }
              ]
            },
            include: {
              uploadedBy: { select: { id: true, name: true, avatarUrl: true } }
            },
            take: 10,
            orderBy: [{ updatedAt: 'desc' }]
          }).then(files =>
            files.map(file => ({
              id: file.id,
              title: file.title,
              content: file.description || undefined,
              type: 'FILE' as const,
              author: file.uploadedBy ? {
                id: file.uploadedBy.id,
                name: file.uploadedBy.name,
                avatarUrl: file.uploadedBy.avatarUrl || undefined
              } : undefined,
              tags: this.parseTags(file.tags),
              relevanceScore: this.calculateKeywordRelevance(query, file.title, file.description),
              url: file.url,
              createdAt: file.createdAt.toISOString(),
              updatedAt: file.updatedAt.toISOString()
            }))
          )
        );
      }

      // 강의실 검색
      if (options.type === 'COURSE' || options.type === 'ALL') {
        promises.push(
          prisma.classroom.findMany({
            where: {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { category: { contains: query } }
              ]
            },
            include: {
              owner: { select: { id: true, name: true, avatarUrl: true } }
            },
            take: 10,
            orderBy: [{ updatedAt: 'desc' }]
          }).then(classrooms =>
            classrooms.map(classroom => ({
              id: classroom.id,
              title: classroom.name,
              content: classroom.description || undefined,
              type: 'COURSE' as const,
              author: classroom.owner ? {
                id: classroom.owner.id,
                name: classroom.owner.name,
                avatarUrl: classroom.owner.avatarUrl || undefined
              } : undefined,
              tags: [classroom.category, classroom.level].filter(Boolean),
              relevanceScore: this.calculateKeywordRelevance(query, classroom.name, classroom.description),
              url: `/classrooms/${classroom.id}`,
              createdAt: classroom.createdAt.toISOString(),
              updatedAt: classroom.updatedAt.toISOString()
            }))
          )
        );
      }

      const searchResults = await Promise.all(promises);
      searchResults.forEach(resultArray => {
        results.push(...resultArray);
      });

      // 관련성 점수로 정렬
      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 15); // 상위 15개

    } catch (error) {
      logger.error('키워드 검색 오류:', error);
      return [];
    }
  }

  /**
   * 2순위: 의미 검색 (키워드 검색 결과 부족할 때)
   */
  private async performSemanticSearch(options: AISearchOptions): Promise<SearchResult[]> {
    logger.info('의미 검색 실행 (AI 기반)');
    
    // 실제 구현에서는 벡터 DB나 OpenAI Embeddings 사용
    // 현재는 더미 데이터로 의미 검색 시뮬레이션
    return this.getDummySearchResults(options.query);
  }

  /**
   * 키워드 관련성 점수 계산 (정확한 매칭 우선)
   */
  private calculateKeywordRelevance(query: string, title: string, content?: string | null): number {
    const lowerQuery = query.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerContent = content?.toLowerCase() || '';
    
    let score = 0;
    
    // 완전 일치 (가장 높은 점수)
    if (lowerTitle === lowerQuery) score += 1.0;
    else if (lowerTitle.includes(lowerQuery)) score += 0.8;
    
    // 내용에서의 일치
    if (lowerContent.includes(lowerQuery)) score += 0.4;
    
    // 단어별 매칭
    const queryWords = lowerQuery.split(' ');
    queryWords.forEach(word => {
      if (word.length > 2) {
        if (lowerTitle.includes(word)) score += 0.3;
        if (lowerContent.includes(word)) score += 0.1;
      }
    });
    
    return Math.min(score, 1.0);
  }

  /**
   * OpenAI를 사용한 의미적 관련성 점수 향상
   */
  private async enhanceWithAIRelevance(query: string, results: SearchResult[]): Promise<void> {
    try {
      // 각 결과에 대해 AI 관련성 점수 계산
      const enhancePromises = results.map(async (result) => {
        try {
          const prompt = `
검색어: "${query}"
콘텐츠 제목: "${result.title}"
콘텐츠 내용: "${(result.content || '').slice(0, 500)}"

위 검색어와 콘텐츠의 의미적 관련성을 0.0~1.0 점수로 평가해주세요.
- 1.0: 매우 관련성 높음
- 0.7: 관련성 높음  
- 0.5: 보통
- 0.3: 관련성 낮음
- 0.0: 전혀 관련 없음

점수만 숫자로 응답해주세요 (예: 0.8)
`;

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 10,
            temperature: 0.1,
          });

          const aiScore = parseFloat(response.choices[0].message.content?.trim() || '0');
          
          // AI 점수와 기본 점수를 조합 (AI 점수에 70% 가중치)
          if (!isNaN(aiScore) && aiScore >= 0 && aiScore <= 1) {
            result.relevanceScore = (aiScore * 0.7) + (result.relevanceScore * 0.3);
          }
          
        } catch (error) {
          logger.warn(`AI 관련성 점수 계산 실패 (${result.id}):`, error);
        }
      });

      await Promise.all(enhancePromises);
      
    } catch (error) {
      logger.warn('AI 관련성 점수 향상 실패:', error);
    }
  }

  /**
   * AI 요약 생성
   */
  private async addAISummaries(results: SearchResult[]): Promise<void> {
    try {
      const summaryPromises = results.map(async (result) => {
        if (result.content && result.content.length > 100) {
          try {
            // 캐시 확인
            const cacheKey = cacheService.generateSummaryCacheKey(result.content);
            const cachedSummary = cacheService.get<string>('summaries', cacheKey);
            
            if (cachedSummary) {
              result.aiSummary = cachedSummary;
              return;
            }

            const prompt = `다음 콘텐츠를 1-2문장으로 요약해주세요:

${result.content.slice(0, this.MAX_CONTENT_LENGTH)}

요약:`;
            
            const response = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 100,
              temperature: 0.3,
            });
            
            const summary = response.choices[0].message.content?.trim();
            if (summary) {
              result.aiSummary = summary;
              cacheService.set('summaries', cacheKey, summary, 120); // 2시간 캐싱
            }
            
          } catch (error) {
            logger.warn(`AI 요약 생성 실패 (${result.id}):`, error);
          }
        }
      });
      
      await Promise.all(summaryPromises);
      
    } catch (error) {
      logger.warn('AI 요약 생성 중 오류:', error);
    }
  }

  /**
   * 검색 제안 생성
   */
  async generateSearchSuggestions(query: string): Promise<string[]> {
    try {
      // 캐시 확인
      const cacheKey = cacheService.generateSuggestionsCacheKey(query);
      const cachedSuggestions = cacheService.get<string[]>('suggestions', cacheKey);
      
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      // 기본 제안 생성
      const basicSuggestions = await this.getBasicSuggestions(query);
      
      let finalSuggestions: string[] = basicSuggestions;

      // AI 기반 제안
      if (this.isOpenAIAvailable()) {
        try {
          const prompt = `"${query}"와 관련된 교육 검색어 제안 5개를 JSON 배열로 생성해주세요:
["제안1", "제안2", "제안3", "제안4", "제안5"]`;

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
            temperature: 0.7,
          });

          const aiSuggestions = JSON.parse(response.choices[0].message.content || '[]');
          if (Array.isArray(aiSuggestions)) {
            finalSuggestions = [...new Set([...basicSuggestions, ...aiSuggestions])].slice(0, 8);
          }
        } catch (error) {
          logger.warn('AI 제안 생성 실패:', error);
        }
      }
      
      // 캐시에 저장
      cacheService.set('suggestions', cacheKey, finalSuggestions, 60);
      
      return finalSuggestions;
      
    } catch (error) {
      logger.error('검색 제안 생성 오류:', error);
      return this.getBasicSuggestions(query);
    }
  }

  /**
   * 자동 태그 생성
   */
  async generateAutoTags(content: string): Promise<string[]> {
    try {
      // 캐시 확인
      const cacheKey = cacheService.generateTagsCacheKey(content);
      const cachedTags = cacheService.get<string[]>('tags', cacheKey);
      
      if (cachedTags) {
        return cachedTags;
      }

      let tags: string[] = [];

      if (this.isOpenAIAvailable()) {
        try {
          const prompt = `다음 콘텐츠에 적합한 태그 5-8개를 JSON 배열로 생성해주세요:

${content.slice(0, this.MAX_CONTENT_LENGTH)}

JSON 형식으로 응답:
["태그1", "태그2", "태그3"]`;

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.5,
          });

          const aiTags = JSON.parse(response.choices[0].message.content || '[]');
          tags = Array.isArray(aiTags) ? aiTags.slice(0, 8) : this.generateBasicTags(content);
        } catch (error) {
          logger.warn('AI 태그 생성 실패:', error);
          tags = this.generateBasicTags(content);
        }
      } else {
        tags = this.generateBasicTags(content);
      }
      
      // 캐시에 저장
      cacheService.set('tags', cacheKey, tags, 120);
      
      return tags;
      
    } catch (error) {
      logger.warn('태그 생성 실패:', error);
      return this.generateBasicTags(content);
    }
  }

  // 유틸리티 메서드들

  private isOpenAIAvailable(): boolean {
    return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-development');
  }

  private generateCacheKey(options: AISearchOptions): string {
    return cacheService.generateQueryCacheKey(options.query, options.type, options.userId);
  }

  private parseTags(tagsString: string): string[] {
    try {
      return Array.isArray(JSON.parse(tagsString)) ? JSON.parse(tagsString) : [];
    } catch {
      return tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
    }
  }

  private async getBasicSuggestions(query: string): Promise<string[]> {
    try {
      // 데이터베이스에서 유사한 제목들 검색
      const posts = await prisma.post.findMany({
        where: { title: { contains: query } },
        select: { title: true },
        take: 5
      });

      const files = await prisma.file.findMany({
        where: { title: { contains: query } },
        select: { title: true },
        take: 5
      });

      const allTitles = [...posts.map(p => p.title), ...files.map(f => f.title)];
      return [...new Set(allTitles)].slice(0, 5);
      
    } catch (error) {
      logger.warn('기본 제안 생성 실패:', error);
      return [];
    }
  }

  private generateBasicTags(content: string): string[] {
    // 기본 키워드 추출
    const words = content.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['그리고', '하지만', '또한', 'the', 'and', 'or'].includes(word));
    
    // 빈도 계산 후 상위 5개 선택
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private async saveSearchHistory(options: AISearchOptions): Promise<void> {
    try {
      // TODO: 실제 검색 기록 저장 로직
      logger.info('검색 기록', {
        query: options.query,
        type: options.type,
        userId: options.userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('검색 기록 저장 실패:', error);
    }
  }

  /**
   * 더미 검색 결과 생성 (데이터베이스에 데이터가 없을 때)
   */
  private getDummySearchResults(query: string): SearchResult[] {
    const baseResults = [
      {
        id: 'dummy-1',
        title: `${query} 기초 강의`,
        content: `${query}의 기본 문법과 개념을 학습할 수 있는 입문 강의입니다.`,
        type: 'COURSE' as const,
        author: {
          id: 'instructor-1',
          name: '김강사',
          avatarUrl: undefined
        },
        tags: [query, '프로그래밍', '입문', '웹개발'],
        relevanceScore: 0.9,
        url: '/classrooms/dummy-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'dummy-2',
        title: `${query} 실전 프로젝트`,
        content: `${query}를 사용한 실제 프로젝트 구축 방법을 설명합니다.`,
        type: 'POST' as const,
        author: {
          id: 'author-2',
          name: '이개발',
          avatarUrl: undefined
        },
        tags: [query, '프로젝트', '실전'],
        relevanceScore: 0.8,
        url: '/posts/dummy-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'dummy-3',
        title: `${query} 참고 자료`,
        content: `${query} 학습에 도움이 되는 각종 참고 자료와 문서입니다.`,
        type: 'FILE' as const,
        author: {
          id: 'author-3',
          name: '박자료',
          avatarUrl: undefined
        },
        tags: [query, '자료', '문서'],
        relevanceScore: 0.7,
        url: 'https://example.com/guide.pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 검색어와 관련성이 높은 결과들을 필터링하고 점수 조정
    return baseResults.map(result => ({
      ...result,
      relevanceScore: this.calculateKeywordRelevance(query, result.title, result.content)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

// 싱글톤 인스턴스 생성
export const aiSearchService = new AISearchService();
