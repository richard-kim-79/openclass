import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = '30d';

// 토큰 페이로드 인터페이스
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// 회원가입 검증 스키마
export const registerSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 영문 대소문자와 숫자를 포함해야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다').max(50, '이름은 50자 이내여야 합니다'),
});

// 로그인 검증 스키마
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

// 비밀번호 변경 검증 스키마
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
  newPassword: z.string()
    .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '새 비밀번호는 영문 대소문자와 숫자를 포함해야 합니다'),
});

// 프로필 업데이트 검증 스키마
export const updateProfileSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다').max(50, '이름은 50자 이내여야 합니다').optional(),
  avatarUrl: z.string().url('유효한 URL을 입력하세요').optional(),
});

// 비밀번호 해싱
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// 비밀번호 검증
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// JWT 토큰 생성
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'openclass',
    audience: 'openclass-users',
  });
};

// Refresh 토큰 생성
export const generateRefreshToken = (payload: Pick<TokenPayload, 'userId'>): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'openclass',
    audience: 'openclass-users',
  });
};

// JWT 토큰 검증
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'openclass',
      audience: 'openclass-users',
    }) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('토큰이 만료되었습니다');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('유효하지 않은 토큰입니다');
    } else {
      throw new Error('토큰 검증에 실패했습니다');
    }
  }
};

// Refresh 토큰 검증
export const verifyRefreshToken = (token: string): Pick<TokenPayload, 'userId'> => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'openclass',
      audience: 'openclass-users',
    }) as Pick<TokenPayload, 'userId'>;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('리프레시 토큰이 만료되었습니다');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('유효하지 않은 리프레시 토큰입니다');
    } else {
      throw new Error('리프레시 토큰 검증에 실패했습니다');
    }
  }
};

// 토큰에서 Bearer 제거
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// 랜덤 토큰 생성 (비밀번호 재설정용)
export const generateRandomToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};

// 이메일 검증
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 강도 검증
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // 길이 체크
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('최소 8자 이상이어야 합니다');
  }

  // 소문자 체크
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('영문 소문자를 포함해야 합니다');
  }

  // 대문자 체크
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('영문 대문자를 포함해야 합니다');
  }

  // 숫자 체크
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('숫자를 포함해야 합니다');
  }

  // 특수문자 체크 (보너스)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

// 사용자 역할 권한 체크
export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    'student': 0,
    'instructor': 1,
    'admin': 2,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? -1;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 999;

  return userLevel >= requiredLevel;
};
