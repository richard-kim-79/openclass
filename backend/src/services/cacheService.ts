import { CacheEntry, SearchCache } from '../types/aiSearch';
import { logger } from '../utils/logger';

/**
 * 인메모리 캐시 서비스
 * 개발 환경에서 사용하며, 프로덕션에서는 Redis로 대체 가능
 */
export class CacheService {
  private cache: SearchCache;
  private readonly defaultExpiry: number = 30 * 60 * 1000; // 30분
  private hitCount: number = 0;
  private missCount: number = 0;

  constructor() {
    this.cache = {
      queries: new Map(),
      suggestions: new Map(),
      tags: new Map(),
      summaries: new Map(),
    };
    
    // 주기적으로 만료된 캐시 정리
    this.startCleanupInterval();
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(type: keyof SearchCache, key: string): T | null {
    try {
      const cacheMap = this.cache[type] as Map<string, CacheEntry<T>>;
      const entry = cacheMap.get(key);
      
      if (!entry) {
        this.missCount++;
        return null;
      }
      
      // 만료 확인
      if (Date.now() > entry.expiry) {
        cacheMap.delete(key);
        this.missCount++;
        return null;
      }
      
      this.hitCount++;
      return entry.data;
    } catch (error) {
      logger.warn(`캐시 조회 실패 (${type}:${key}):`, error);
      this.missCount++;
      return null;
    }
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(
    type: keyof SearchCache, 
    key: string, 
    data: T, 
    expiryMinutes?: number
  ): void {
    try {
      const cacheMap = this.cache[type] as Map<string, CacheEntry<T>>;
      const expiry = Date.now() + (expiryMinutes || 30) * 60 * 1000;
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry,
        key,
      };
      
      cacheMap.set(key, entry);
      
      logger.debug(`캐시 저장 완료 (${type}:${key})`);
    } catch (error) {
      logger.warn(`캐시 저장 실패 (${type}:${key}):`, error);
    }
  }

  /**
   * 캐시에서 데이터 삭제
   */
  delete(type: keyof SearchCache, key: string): boolean {
    try {
      const cacheMap = this.cache[type];
      return cacheMap.delete(key);
    } catch (error) {
      logger.warn(`캐시 삭제 실패 (${type}:${key}):`, error);
      return false;
    }
  }

  /**
   * 특정 타입의 모든 캐시 삭제
   */
  clear(type: keyof SearchCache): void {
    try {
      this.cache[type].clear();
      logger.info(`캐시 타입 전체 삭제: ${type}`);
    } catch (error) {
      logger.warn(`캐시 전체 삭제 실패 (${type}):`, error);
    }
  }

  /**
   * 모든 캐시 삭제
   */
  clearAll(): void {
    try {
      Object.keys(this.cache).forEach(type => {
        this.clear(type as keyof SearchCache);
      });
      this.hitCount = 0;
      this.missCount = 0;
      logger.info('전체 캐시 삭제 완료');
    } catch (error) {
      logger.warn('전체 캐시 삭제 실패:', error);
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): {
    totalEntries: number;
    entriesByType: Record<keyof SearchCache, number>;
    memoryUsage: number;
    hitRate: number;
    hitCount: number;
    missCount: number;
  } {
    try {
      const stats = {
        totalEntries: 0,
        entriesByType: {} as Record<keyof SearchCache, number>,
        memoryUsage: 0,
        hitRate: 0,
        hitCount: this.hitCount,
        missCount: this.missCount,
      };
      
      Object.entries(this.cache).forEach(([type, map]) => {
        const count = map.size;
        stats.entriesByType[type as keyof SearchCache] = count;
        stats.totalEntries += count;
      });
      
      // 대략적인 메모리 사용량 계산 (KB)
      stats.memoryUsage = Math.round(stats.totalEntries * 0.5); // 대략적 추정
      
      // 히트율 계산
      const totalRequests = this.hitCount + this.missCount;
      stats.hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
      
      return stats;
    } catch (error) {
      logger.warn('캐시 통계 조회 실패:', error);
      return {
        totalEntries: 0,
        entriesByType: {
          queries: 0,
          suggestions: 0,
          tags: 0,
          summaries: 0,
        },
        memoryUsage: 0,
        hitRate: 0,
        hitCount: 0,
        missCount: 0,
      };
    }
  }

  /**
   * 검색 쿼리용 캐시 키 생성
   */
  generateQueryCacheKey(query: string, type?: string, userId?: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    const keyParts = [normalizedQuery];
    
    if (type && type !== 'ALL') {
      keyParts.push(type.toLowerCase());
    }
    
    if (userId) {
      keyParts.push(userId);
    }
    
    return keyParts.join(':');
  }

  /**
   * 제안용 캐시 키 생성
   */
  generateSuggestionsCacheKey(query: string, limit?: number): string {
    const normalizedQuery = query.toLowerCase().trim();
    return `${normalizedQuery}:${limit || 8}`;
  }

  /**
   * 태그용 캐시 키 생성
   */
  generateTagsCacheKey(content: string, maxTags?: number): string {
    // 내용의 해시값 생성 (간단한 해시)
    const contentHash = this.simpleHash(content.substring(0, 200));
    return `${contentHash}:${maxTags || 8}`;
  }

  /**
   * 요약용 캐시 키 생성
   */
  generateSummaryCacheKey(content: string): string {
    return this.simpleHash(content.substring(0, 500));
  }

  /**
   * 만료된 캐시 정리
   */
  private cleanupExpiredEntries(): void {
    try {
      let cleanedCount = 0;
      const now = Date.now();
      
      Object.entries(this.cache).forEach(([type, map]) => {
        for (const [key, entry] of map.entries()) {
          if (now > entry.expiry) {
            map.delete(key);
            cleanedCount++;
          }
        }
      });
      
      if (cleanedCount > 0) {
        logger.debug(`만료된 캐시 ${cleanedCount}개 정리 완료`);
      }
    } catch (error) {
      logger.warn('캐시 정리 중 오류:', error);
    }
  }

  /**
   * 정리 작업 스케줄링
   */
  private startCleanupInterval(): void {
    // 5분마다 만료된 캐시 정리
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * 캐시 워밍업 - 자주 사용되는 검색어들을 미리 캐싱
   */
  async warmupCache(): Promise<void> {
    try {
      const popularQueries = [
        'JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS',
        '프로그래밍', '알고리즘', '데이터구조', '웹개발'
      ];
      
      logger.info('캐시 워밍업 시작...');
      
      // 인기 검색어들에 대한 제안을 미리 생성하여 캐싱
      for (const query of popularQueries) {
        const cacheKey = this.generateSuggestionsCacheKey(query);
        const suggestions = this.generateBasicSuggestions(query);
        this.set('suggestions', cacheKey, suggestions, 60); // 1시간 캐싱
      }
      
      logger.info('캐시 워밍업 완료');
    } catch (error) {
      logger.warn('캐시 워밍업 실패:', error);
    }
  }

  /**
   * 기본 제안 생성 (캐시 워밍업용)
   */
  private generateBasicSuggestions(query: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      'javascript': ['JavaScript 기초', 'JavaScript ES6', 'JavaScript DOM', 'JavaScript 비동기'],
      'python': ['Python 기초', 'Python 데이터분석', 'Python 웹개발', 'Python 머신러닝'],
      'react': ['React 컴포넌트', 'React Hooks', 'React Router', 'React 상태관리'],
      'nodejs': ['Node.js 기초', 'Node.js Express', 'Node.js API', 'Node.js 데이터베이스'],
      'html': ['HTML 기초', 'HTML5', 'HTML 시맨틱', 'HTML 폼'],
      'css': ['CSS 기초', 'CSS Flexbox', 'CSS Grid', 'CSS 애니메이션'],
      '프로그래밍': ['프로그래밍 기초', '프로그래밍 언어', '프로그래밍 패턴', '프로그래밍 실습'],
      '알고리즘': ['알고리즘 기초', '정렬 알고리즘', '탐색 알고리즘', '그래프 알고리즘'],
      '데이터구조': ['배열', '연결리스트', '스택', '큐', '트리', '해시테이블'],
      '웹개발': ['프론트엔드', '백엔드', 'REST API', '데이터베이스', '배포']
    };
    
    const lowerQuery = query.toLowerCase();
    return suggestionMap[lowerQuery] || [`${query} 기초`, `${query} 심화`, `${query} 실습`];
  }
}

// 싱글톤 인스턴스 생성
export const cacheService = new CacheService();

// 서버 시작 시 캐시 워밍업
if (process.env.NODE_ENV === 'production') {
  cacheService.warmupCache();
}
