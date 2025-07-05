// 공통 타입에서 가져오기
export type SocialProvider = 'google' | 'naver' | 'kakao';
export type UserRole = 'student' | 'instructor' | 'admin';
export type Subscription = 'free' | 'premium' | 'enterprise';

// 사용자 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  provider?: SocialProvider;
  providerId?: string;
  role: UserRole;
  subscription: Subscription;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API 키 타입
export interface ApiKey {
  key: string;
  createdAt: string;
  usage: ApiUsage;
}

export interface ApiUsage {
  totalCalls: number;
  todayCalls: number;
  monthlyCalls: number;
  limit: number;
}

// 토큰 타입
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// 로그인 요청 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 소셜 로그인 요청 타입
export interface SocialLoginRequest {
  provider: SocialProvider;
  accessToken: string;
}

// 회원가입 요청 타입
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

// 인증 응답 타입
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: Tokens;
  };
}

// 프로필 업데이트 요청 타입
export interface UpdateProfileRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

// 비밀번호 변경 요청 타입
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// API 에러 타입
export interface ApiError {
  success: false;
  error: string;
  code: string;
}

// 인증 상태 타입
export interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// 로컬 스토리지 키
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'openclass_access_token',
  REFRESH_TOKEN: 'openclass_refresh_token',
  USER: 'openclass_user',
} as const;