import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// 보안 헤더 설정
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "res.cloudinary.com", "*.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "res.cloudinary.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Rate limiting 설정
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || {
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// API별 rate limit 설정
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100); // 15분에 100요청
export const authRateLimit = createRateLimit(15 * 60 * 1000, 10); // 15분에 10요청
export const searchRateLimit = createRateLimit(1 * 60 * 1000, 30); // 1분에 30요청
export const uploadRateLimit = createRateLimit(1 * 60 * 1000, 10); // 1분에 10요청

// 입력 데이터 검증 미들웨어
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // XSS 방지: HTML 태그 제거
  const sanitizeString = (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  // 재귀적으로 객체의 문자열 필드를 정리
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// CORS 설정 강화
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://openclass-production.vercel.app',
      'https://*.vercel.app',
    ];

    // 개발 환경에서는 모든 localhost 허용
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:*');
    }

    // 환경 변수로 추가 도메인 설정
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }

    if (!origin || allowedOrigins.some(allowed => 
      allowed.includes('*') ? 
        origin.match(allowed.replace('*', '.*')) : 
        origin === allowed
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24시간
};

// 에러 응답 표준화
export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  details?: any
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    // 프로덕션에서는 상세 에러 정보 숨김
    ...(isProduction ? {} : { details }),
  };
};

// 민감한 정보 로깅 방지
export const sanitizeForLogging = (data: any): any => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

// 환경 변수 검증
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // JWT 시크릿 강도 검증
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    console.warn('⚠️ JWT_SECRET should be at least 32 characters long for security');
  }

  // 프로덕션 환경 추가 검증
  if (process.env.NODE_ENV === 'production') {
    const productionRequiredVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];

    const missingProdVars = productionRequiredVars.filter(varName => !process.env[varName]);
    
    if (missingProdVars.length > 0) {
      console.warn(`⚠️ Missing production environment variables: ${missingProdVars.join(', ')}`);
    }
  }
};
