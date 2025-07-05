import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// 커스텀 에러 클래스들
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  details?: any;
  
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '인증에 실패했습니다') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '권한이 없습니다') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '리소스를 찾을 수 없습니다') {
    super(message, 404, 'NOT_FOUND');
  }
}

// 에러 핸들러 미들웨어
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = '서버 내부 오류가 발생했습니다';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // 커스텀 에러인 경우
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    if (error instanceof ValidationError) {
      details = error.details;
    }
  } else {
    // 일반 Error 객체인 경우
    if (error.message) {
      message = error.message;
    }
  }

  // 로그 기록
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 응답 전송
  const errorResponse = {
    success: false,
    error: message,
    code,
    details
  };

  res.status(statusCode).json(errorResponse);
};

// 404 에러 핸들러
export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse = {
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다',
    code: 'NOT_FOUND'
  };

  res.status(404).json(errorResponse);
}; 