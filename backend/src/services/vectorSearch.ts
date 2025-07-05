import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VectorSearchService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * 텍스트를 OpenAI 임베딩으로 변환
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' ').trim(),
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw new Error('Failed to create embedding');
    }
  }

  /**
   * 의미검색 실행
   */
  async semanticSearch(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      sourceType?: string;
      userId?: number;
    } = {}
  ) {
    const { limit = 10, threshold = 0.7, sourceType, userId } = options;

    try {
      // 쿼리 임베딩 생성
      const queryEmbedding = await this.createEmbedding(query);
      
      // 검색 시작 시간 기록
      const startTime = Date.now();

      // pgvector 의미검색 실행
      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          content,
          title,
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity,
          source_type,
          source_id,
          metadata,
          created_at
        FROM document_embeddings
        WHERE 
          ${sourceType ? `source_type = ${sourceType} AND` : ''} 
          1 - (embedding <=> ${queryEmbedding}::vector) >= ${threshold}
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;

      const responseTime = Date.now() - startTime;

      // 검색 통계 저장
      if (userId) {
        await this.saveSearchAnalytics(
          query,
          queryEmbedding,
          results.length,
          userId,
          'semantic',
          responseTime
        );
      }

      return results;
    } catch (error) {
      console.error('Semantic search error:', error);
      throw new Error('Semantic search failed');
    }
  }

  /**
   * 하이브리드 검색 (키워드 + 벡터)
   */
  async hybridSearch(
    query: string,
    options: {
      limit?: number;
      keywordWeight?: number;
      vectorWeight?: number;
      userId?: number;
    } = {}
  ) {
    const { 
      limit = 10, 
      keywordWeight = 0.3, 
      vectorWeight = 0.7, 
      userId 
    } = options;

    try {
      const queryEmbedding = await this.createEmbedding(query);
      const startTime = Date.now();

      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          content,
          title,
          (${keywordWeight} * ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) + 
           ${vectorWeight} * (1 - (embedding <=> ${queryEmbedding}::vector))) as combined_score,
          ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) as keyword_score,
          1 - (embedding <=> ${queryEmbedding}::vector) as vector_score,
          source_type,
          source_id,
          metadata
        FROM document_embeddings
        WHERE 
          to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
          OR (1 - (embedding <=> ${queryEmbedding}::vector)) > 0.5
        ORDER BY combined_score DESC
        LIMIT ${limit}
      `;

      const responseTime = Date.now() - startTime;

      if (userId) {
        await this.saveSearchAnalytics(
          query,
          queryEmbedding,
          results.length,
          userId,
          'hybrid',
          responseTime
        );
      }

      return results;
    } catch (error) {
      console.error('Hybrid search error:', error);
      throw new Error('Hybrid search failed');
    }
  }

  /**
   * 문서를 임베딩하여 저장
   */
  async addDocument(
    content: string,
    metadata: {
      title?: string;
      sourceType: string;
      sourceId: number;
      additionalData?: any;
    }
  ) {
    try {
      const embedding = await this.createEmbedding(content);

      await prisma.$executeRaw`
        INSERT INTO document_embeddings (content, title, embedding, source_type, source_id, metadata)
        VALUES (${content}, ${metadata.title || ''}, ${embedding}::vector, ${metadata.sourceType}, ${metadata.sourceId}, ${JSON.stringify(metadata.additionalData || {})})
      `;

      return { success: true, message: 'Document embedded successfully' };
    } catch (error) {
      console.error('Error adding document:', error);
      throw new Error('Failed to add document embedding');
    }
  }

  /**
   * 유사한 문서 추천
   */
  async findSimilarDocuments(
    documentId: number,
    limit: number = 5
  ) {
    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          similar.id,
          similar.content,
          similar.title,
          1 - (target.embedding <=> similar.embedding) as similarity,
          similar.source_type,
          similar.source_id
        FROM document_embeddings target,
             document_embeddings similar
        WHERE target.id = ${documentId}
          AND similar.id != ${documentId}
        ORDER BY target.embedding <=> similar.embedding
        LIMIT ${limit}
      `;

      return results;
    } catch (error) {
      console.error('Error finding similar documents:', error);
      throw new Error('Failed to find similar documents');
    }
  }

  /**
   * 사용자 맞춤 추천
   */
  async getPersonalizedRecommendations(
    userId: number,
    limit: number = 10
  ) {
    try {
      // 사용자의 검색 히스토리 기반 선호도 벡터 생성
      const userPreference = await this.getUserPreferenceVector(userId);
      
      if (!userPreference) {
        // 선호도가 없으면 최신 인기 문서 반환
        return await this.getPopularDocuments(limit);
      }

      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          content,
          title,
          1 - (embedding <=> ${userPreference}::vector) as relevance,
          source_type,
          source_id,
          metadata
        FROM document_embeddings
        ORDER BY embedding <=> ${userPreference}::vector
        LIMIT ${limit}
      `;

      return results;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }

  /**
   * 문서 청킹 (긴 텍스트를 의미 있는 청크로 분할)
   */
  splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim() + '.';
      
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // 오버랩을 위해 마지막 몇 문장 유지
        const overlapSentences = sentences.slice(Math.max(0, i - 2), i);
        currentChunk = overlapSentences.join('. ') + (overlapSentences.length > 0 ? '. ' : '');
      }
      
      currentChunk += sentence + ' ';
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * 대용량 문서 처리 (청킹 후 임베딩)
   */
  async processLargeDocument(
    content: string,
    metadata: {
      title?: string;
      sourceType: string;
      sourceId: number;
      additionalData?: any;
    }
  ) {
    try {
      const chunks = this.splitIntoChunks(content);
      const results = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkMetadata = {
          ...metadata,
          additionalData: {
            ...metadata.additionalData,
            chunkIndex: i,
            totalChunks: chunks.length,
            isChunked: true
          }
        };

        const result = await this.addDocument(chunks[i], chunkMetadata);
        results.push(result);
      }

      return {
        success: true,
        message: `Document processed into ${chunks.length} chunks`,
        chunks: chunks.length
      };
    } catch (error) {
      console.error('Error processing large document:', error);
      throw new Error('Failed to process large document');
    }
  }

  /**
   * RAG (Retrieval Augmented Generation) 지원
   */
  async getContextForQuery(query: string, maxTokens: number = 4000) {
    try {
      const searchResults = await this.hybridSearch(query, { limit: 5 });
      
      let context = '';
      let tokenCount = 0;

      for (const result of searchResults) {
        const resultText = `${result.title ? result.title + ': ' : ''}${result.content}\n\n`;
        const estimatedTokens = Math.ceil(resultText.length / 4); // 대략적인 토큰 계산
        
        if (tokenCount + estimatedTokens > maxTokens) {
          break;
        }
        
        context += resultText;
        tokenCount += estimatedTokens;
      }

      return {
        context,
        sources: searchResults.map(r => ({
          id: r.id,
          title: r.title,
          sourceType: r.source_type,
          sourceId: r.source_id,
          similarity: r.combined_score || r.vector_score
        })),
        tokenCount
      };
    } catch (error) {
      console.error('Error getting context for query:', error);
      throw new Error('Failed to get context for query');
    }
  }

  /**
   * 검색 통계 저장
   */
  private async saveSearchAnalytics(
    queryText: string,
    queryEmbedding: number[],
    resultsCount: number,
    userId: number,
    searchType: string,
    responseTimeMs: number
  ) {
    try {
      await prisma.$executeRaw`
        INSERT INTO search_analytics 
        (query_text, query_embedding, results_count, user_id, search_type, response_time_ms)
        VALUES 
        (${queryText}, ${queryEmbedding}::vector, ${resultsCount}, ${userId}, ${searchType}, ${responseTimeMs})
      `;
    } catch (error) {
      console.error('Error saving search analytics:', error);
      // 통계 저장 실패는 검색 자체를 실패시키지 않음
    }
  }

  /**
   * 사용자 선호도 벡터 가져오기
   */
  private async getUserPreferenceVector(userId: number): Promise<number[] | null> {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT preference_embedding 
        FROM user_preferences 
        WHERE user_id = ${userId}
      `;

      return result.length > 0 ? result[0].preference_embedding : null;
    } catch (error) {
      console.error('Error getting user preference vector:', error);
      return null;
    }
  }

  /**
   * 인기 문서 가져오기
   */
  private async getPopularDocuments(limit: number) {
    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          de.id,
          de.content,
          de.title,
          de.source_type,
          de.source_id,
          de.metadata,
          COUNT(sa.id) as search_count
        FROM document_embeddings de
        LEFT JOIN search_analytics sa ON sa.query_text ILIKE '%' || de.title || '%'
        WHERE de.created_at > NOW() - INTERVAL '30 days'
        GROUP BY de.id, de.content, de.title, de.source_type, de.source_id, de.metadata
        ORDER BY search_count DESC, de.created_at DESC
        LIMIT ${limit}
      `;

      return results;
    } catch (error) {
      console.error('Error getting popular documents:', error);
      return [];
    }
  }

  /**
   * 사용자 선호도 업데이트
   */
  async updateUserPreferences(userId: number) {
    try {
      // 사용자의 최근 검색 히스토리 기반으로 선호도 벡터 계산
      const recentSearches = await prisma.$queryRaw<any[]>`
        SELECT query_embedding
        FROM search_analytics
        WHERE user_id = ${userId} 
          AND created_at > NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 20
      `;

      if (recentSearches.length === 0) return;

      // 임베딩들의 평균 계산 (단순화된 선호도 벡터)
      const dimensions = 1536;
      const avgEmbedding = new Array(dimensions).fill(0);

      recentSearches.forEach(search => {
        const embedding = search.query_embedding;
        for (let i = 0; i < dimensions; i++) {
          avgEmbedding[i] += embedding[i] / recentSearches.length;
        }
      });

      // 사용자 선호도 저장/업데이트
      await prisma.$executeRaw`
        INSERT INTO user_preferences (user_id, preference_embedding, updated_at)
        VALUES (${userId}, ${avgEmbedding}::vector, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          preference_embedding = ${avgEmbedding}::vector,
          updated_at = NOW()
      `;

    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * 검색 성능 분석
   */
  async getSearchAnalytics(timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const interval = timeRange === 'day' ? '1 day' : 
                     timeRange === 'week' ? '7 days' : '30 days';

      const analytics = await prisma.$queryRaw<any[]>`
        SELECT 
          search_type,
          COUNT(*) as search_count,
          AVG(response_time_ms) as avg_response_time,
          AVG(results_count) as avg_results_count,
          DATE_TRUNC('hour', created_at) as hour
        FROM search_analytics
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY search_type, DATE_TRUNC('hour', created_at)
        ORDER BY hour DESC
      `;

      return analytics;
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return [];
    }
  }
}

export const vectorSearchService = new VectorSearchService();
