import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, extractToken, TokenPayload } from '../utils/auth';

const prisma = new PrismaClient();

// 확장된 Request 인터페이스
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
    subscription: string;
    isActive: boolean;
    isVerified: boolean;
  };
}

// 기본 인증 미들웨어
export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req.header('Authorization'));

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: '인증 토큰이 필요합니다',
        code: 'NO_TOKEN'
      });
    }

    // 토큰 검증
    const decoded: TokenPayload = verifyAccessToken(token);
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        subscription: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: '비활성화된 계정입니다',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 사용자 정보를 요청 객체에 추가
    req.user = {
      ...user,
      avatarUrl: user.avatarUrl || undefined
    };
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    let errorMessage = '인증에 실패했습니다';
    let errorCode = 'AUTH_FAILED';
    
    if (error instanceof Error) {
      if (error.message.includes('만료')) {
        errorMessage = '토큰이 만료되었습니다';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.message.includes('유효하지 않은')) {
        errorMessage = '유효하지 않은 토큰입니다';
        errorCode = 'INVALID_TOKEN';
      }
    }
    
    return res.status(401).json({ 
      success: false,
      error: errorMessage,
      code: errorCode
    });
  }
};

// 옵셔널 인증 미들웨어 (토큰이 있으면 인증, 없어도 통과)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req.header('Authorization'));

    if (!token) {
      // 토큰이 없어도 계속 진행
      return next();
    }

    // 토큰이 있으면 검증 시도
    try {
      const decoded: TokenPayload = verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          subscription: true,
          isActive: true,
          isVerified: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          ...user,
          avatarUrl: user.avatarUrl || undefined
        };
      }
    } catch (tokenError) {
      // 토큰 오류가 있어도 계속 진행 (로그만 남김)
      console.warn('Optional auth token verification failed:', tokenError);
    }

    return next();
  } catch (error) {
    // 예상치 못한 오류가 있어도 계속 진행
    console.error('Optional auth middleware error:', error);
    return next();
  }
};

// 관리자 권한 미들웨어
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: '인증이 필요합니다',
      code: 'NO_AUTH'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: '관리자 권한이 필요합니다',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  return next();
};

// 강사 이상 권한 미들웨어
export const requireInstructor = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: '인증이 필요합니다',
      code: 'NO_AUTH'
    });
  }

  if (!['instructor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      error: '강사 이상의 권한이 필요합니다',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  return next();
};

// 이메일 인증 필수 미들웨어
export const requireVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: '인증이 필요합니다',
      code: 'NO_AUTH'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ 
      success: false,
      error: '이메일 인증이 필요합니다',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  return next();
};

// 기본 인증 미들웨어 alias
export const authMiddleware = auth;