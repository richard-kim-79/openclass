import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

// 메모리 캐시 (간단한 구현)
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private maxSize = 1000; // 최대 캐시 항목 수

  set(key: string, data: any, ttlSeconds: number = 300) {
    // 캐시가 가득 찬 경우 오래된 항목 제거
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // 만료된 항목 정리
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

const memoryCache = new MemoryCache();

// 1분마다 캐시 정리
setInterval(() => {
  memoryCache.cleanup();
}, 60000);

// 캐시 키 생성
const generateCacheKey = (req: Request): string => {
  const { method, query } = req;
  const originalUrl = req.originalUrl || req.url || '';
  const user = (req as any).user; // 타입 안전성을 위해 any로 캐스팅
  const keyData = {
    method,
    url: originalUrl,
    query,
    userId: user?.id || 'anonymous'
  };
  
  return createHash('md5')
    .update(JSON.stringify(keyData))
    .digest('hex');
};

// 캐시 미들웨어
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // POST, PUT, DELETE는 캐싱하지 않음
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cachedData = memoryCache.get(cacheKey);

    if (cachedData) {
      return res.json({
        ...cachedData,
        _cached: true,
        _cacheKey: cacheKey
      });
    }

    // 원본 json 메서드 저장
    const originalJson = res.json;

    // json 메서드 오버라이드
    res.json = function(data: any) {
      // 성공적인 응답만 캐싱
      if (res.statusCode === 200 && data) {
        memoryCache.set(cacheKey, data, ttlSeconds);
      }
      
      // 원본 메서드 호출
      return originalJson.call(this, data);
    };

    next();
  };
};

// 응답 압축 설정
export const compressionConfig = {
  level: 6, // 압축 레벨 (1-9)
  threshold: 1024, // 1KB 이상만 압축
  filter: (req: Request, res: Response) => {
    // 압축하지 않을 조건
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // 이미지, 비디오 파일은 압축하지 않음
    const contentType = res.get('Content-Type') || '';
    if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
      return false;
    }

    return true;
  }
};

// 데이터베이스 쿼리 최적화 헬퍼
export const optimizedQuery = {
  // 페이지네이션 최적화
  paginate: (page: number, limit: number) => {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // 최대 100개
    const skip = (validPage - 1) * validLimit;

    return {
      skip,
      take: validLimit,
      page: validPage,
      limit: validLimit
    };
  },

  // 검색 최적화를 위한 인덱스 힌트
  searchHints: {
    posts: {
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    },
    
    classrooms: {
      include: {
        instructor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    },

    files: {
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    }
  }
};

// API 응답 최적화
export const responseOptimizer = {
  // 불필요한 필드 제거
  sanitizeUser: (user: any) => {
    if (!user) return null;
    
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  },

  // 배열 응답 최적화
  optimizeArray: (items: any[], fields?: string[]) => {
    if (!Array.isArray(items)) return items;
    
    return items.map(item => {
      if (fields) {
        const optimized: any = {};
        fields.forEach(field => {
          if (field in item) {
            optimized[field] = item[field];
          }
        });
        return optimized;
      }
      
      return item;
    });
  },

  // 중첩 객체 최적화
  flattenNested: (obj: any, maxDepth: number = 3) => {
    if (maxDepth <= 0 || typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const flattened: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nested = responseOptimizer.flattenNested(value, maxDepth - 1);
        Object.assign(flattened, nested);
      } else {
        flattened[key] = value;
      }
    }

    return flattened;
  }
};

// 검색 성능 최적화
export const searchOptimizer = {
  // 검색어 정규화
  normalizeQuery: (query: string): string => {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // 연속된 공백 제거
      .replace(/[^\w\s가-힣]/g, ''); // 특수문자 제거 (한글 유지)
  },

  // 검색 제안 최적화
  getSuggestions: (query: string, suggestions: string[]): string[] => {
    const normalizedQuery = searchOptimizer.normalizeQuery(query);
    
    if (normalizedQuery.length < 2) return [];

    return suggestions
      .filter(suggestion => 
        searchOptimizer.normalizeQuery(suggestion).includes(normalizedQuery)
      )
      .slice(0, 5); // 최대 5개만 반환
  },

  // 검색 결과 하이라이팅
  highlightResults: (content: string, query: string): string => {
    const normalizedQuery = searchOptimizer.normalizeQuery(query);
    if (normalizedQuery.length < 2) return content;

    const regex = new RegExp(`(${normalizedQuery})`, 'gi');
    return content.replace(regex, '<mark>$1</mark>');
  }
};

// 이미지 최적화 헬퍼
export const imageOptimizer = {
  // Cloudinary 변환 URL 생성
  getOptimizedUrl: (originalUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}) => {
    if (!originalUrl.includes('cloudinary.com')) {
      return originalUrl;
    }

    const { width = 800, height, quality = 80, format = 'webp' } = options;
    
    // Cloudinary URL 변환
    const transformations = [
      `w_${width}`,
      height ? `h_${height}` : null,
      `q_${quality}`,
      `f_${format}`,
      'c_limit' // 원본 비율 유지
    ].filter(Boolean).join(',');

    return originalUrl.replace(
      '/upload/',
      `/upload/${transformations}/`
    );
  },

  // 반응형 이미지 URL 세트 생성
  getResponsiveUrls: (originalUrl: string) => {
    return {
      thumbnail: imageOptimizer.getOptimizedUrl(originalUrl, { width: 150, height: 150 }),
      small: imageOptimizer.getOptimizedUrl(originalUrl, { width: 400 }),
      medium: imageOptimizer.getOptimizedUrl(originalUrl, { width: 800 }),
      large: imageOptimizer.getOptimizedUrl(originalUrl, { width: 1200 }),
      original: originalUrl
    };
  }
};

// 벡터 검색 성능 최적화
export const vectorSearchOptimizer = {
  // 쿼리 전처리
  preprocessQuery: (query: string): string => {
    return query
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 1000); // 최대 1000자
  },

  // 검색 결과 후처리
  postprocessResults: (results: any[], query: string) => {
    return results.map(result => ({
      ...result,
      content: result.content.length > 300 
        ? result.content.substring(0, 300) + '...' 
        : result.content,
      highlighted: searchOptimizer.highlightResults(result.content, query)
    }));
  },

  // 임베딩 캐싱
  cacheEmbedding: (text: string, embedding: number[]) => {
    if (!text) return;
    const key = `embedding:${createHash('md5').update(text).digest('hex')}`;
    memoryCache.set(key, embedding, 3600); // 1시간 캐시
  },

  getCachedEmbedding: (text: string): number[] | null => {
    if (!text) return null;
    const key = `embedding:${createHash('md5').update(text).digest('hex')}`;
    return memoryCache.get(key);
  }
};

// 성능 모니터링
export const performanceMonitor = {
  // 실행 시간 측정 데코레이터
  timeFunction: (fn: Function, name: string) => {
    return async (...args: any[]) => {
      const start = Date.now();
      try {
        const result = await fn(...args);
        const duration = Date.now() - start;
        
        if (duration > 1000) { // 1초 이상이면 로깅
          console.warn(`⚠️ Slow function: ${name} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ Function error: ${name} failed after ${duration}ms`, error);
        throw error;
      }
    };
  },

  // 메모리 사용량 체크
  checkMemoryUsage: () => {
    const usage = process.memoryUsage();
    const formatMemory = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    
    return {
      rss: formatMemory(usage.rss), // MB
      heapTotal: formatMemory(usage.heapTotal), // MB
      heapUsed: formatMemory(usage.heapUsed), // MB
      external: formatMemory(usage.external), // MB
    };
  },

  // 성능 지표 수집
  collectMetrics: () => {
    return {
      timestamp: new Date().toISOString(),
      memory: performanceMonitor.checkMemoryUsage(),
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      cacheSize: memoryCache['cache'].size
    };
  }
};

// 요청 최적화 미들웨어
export const requestOptimizer = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // 응답 압축 헤더 설정
  if (req.accepts('gzip')) {
    res.set('Content-Encoding', 'gzip');
  }

  // 캐시 헤더 설정
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5분 캐시
  }

  // ETags 활성화 (Express 기본값이지만 명시적 설정)
  res.set('ETag', 'strong');

  // 응답 완료 시 성능 로깅
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // 느린 요청 감지
    if (duration > 2000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });

  next();
};

// 데이터베이스 연결 풀 최적화 설정
export const dbOptimizationConfig = {
  // Prisma 클라이언트 최적화 옵션
  prismaOptions: {
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // 연결 풀 설정
    connection_limit: 20,
    pool_timeout: 20,
    // 쿼리 최적화
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  },

  // 쿼리 타임아웃 설정
  queryTimeout: 30000, // 30초

  // 배치 쿼리 최적화
  batchSize: 100
};

export { memoryCache };
