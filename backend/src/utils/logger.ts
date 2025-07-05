import winston from 'winston';
import path from 'path';

// 로그 레벨 정의
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// 로그 색상 정의
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'grey',
  debug: 'white',
  silly: 'grey'
};

winston.addColors(logColors);

// 로그 형식 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    let log = `${timestamp} [${level}]: ${message}`;
    
    // 메타데이터가 있으면 추가
    if (Object.keys(meta).length > 0) {
      log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }
    
    // 스택 트레이스가 있으면 추가
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    return log;
  })
);

// 파일 로그 형식 (색상 없음)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 로그 디렉토리 설정
const logDir = path.join(process.cwd(), 'logs');

// 로거 생성
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: logFormat,
  defaultMeta: {
    service: 'openclass-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: logFormat
    }),
    
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 모든 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    
    // HTTP 요청 로그
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: fileLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // 처리되지 않은 예외 캐치
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileLogFormat
    })
  ],
  
  // 처리되지 않은 Promise 거부 캐치
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileLogFormat
    })
  ]
});

// 개발 환경에서는 더 자세한 로그
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 로깅 헬퍼 함수들
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, { 
    error: error?.message,
    stack: error?.stack,
    ...meta 
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// 요청 로깅 미들웨어
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // 요청 시작 로그
  logHttp(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method !== 'GET' ? sanitizeForLogging(req.body) : undefined
  });

  // 응답 완료 시 로그
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'http';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
      duration,
      statusCode: res.statusCode,
      ip: req.ip,
      userId: req.user?.id
    });
  });

  next();
};

// 민감한 정보 필터링
const sanitizeForLogging = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

// 에러 로깅 전용 함수
export const logApplicationError = (error: Error, context?: string, meta?: any) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    ...meta
  };

  logger.error('Application Error', errorInfo);

  // 심각한 에러의 경우 추가 알림 (향후 확장)
  if (error.name === 'DatabaseError' || error.name === 'SecurityError') {
    // TODO: 알림 시스템 (이메일, Slack 등) 연동
  }
};

// 성능 로깅
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  const level = duration > 1000 ? 'warn' : 'info'; // 1초 이상이면 경고
  
  logger.log(level, `Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...meta
  });
};

// API 응답 로깅
export const logApiResponse = (endpoint: string, success: boolean, duration: number, meta?: any) => {
  logInfo(`API ${success ? 'Success' : 'Error'}: ${endpoint}`, {
    duration: `${duration}ms`,
    success,
    ...meta
  });
};

// 벡터 검색 관련 로깅
export const logVectorSearch = (query: string, resultCount: number, duration: number, userId?: number) => {
  logInfo('Vector Search', {
    query: query.substring(0, 100), // 쿼리는 100자까지만 로깅
    resultCount,
    duration: `${duration}ms`,
    userId
  });
};

// 보안 이벤트 로깅
export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high', meta?: any) => {
  const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  
  logger.log(logLevel, `Security Event: ${event}`, {
    severity,
    timestamp: new Date().toISOString(),
    ...meta
  });
};

// 사용자 활동 로깅
export const logUserActivity = (userId: number, activity: string, meta?: any) => {
  logInfo(`User Activity: ${activity}`, {
    userId,
    ...meta
  });
};

export default logger;
