import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export interface RateLimitOptions {
  windowMs: number;  // 시간 윈도우 (밀리초)
  max: number;       // 최대 요청 수
  message?: string;  // 제한 시 메시지
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// 기본 Rate Limit 생성 함수
export const rateLimitMiddleware = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message || '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
      error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: options.message || '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(options.windowMs / 1000) // seconds
      });
    }
  });
};

// 사전 정의된 Rate Limits

// 일반 API 요청 (분당 60회)
export const generalRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1분
  max: 60,
  message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
});

// 인증 관련 요청 (분당 5회)
export const authRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1분
  max: 5,
  message: '인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
});

// 파일 업로드 (분당 10회)
export const uploadRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1분
  max: 10,
  message: '파일 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
});

// AI 검색 (분당 10회)
export const aiSearchRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1분
  max: 10,
  message: 'AI 검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
});

// AI 작업 (태그 생성 등, 분당 5회)
export const aiOperationRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1분
  max: 5,
  message: 'AI 작업 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
});
