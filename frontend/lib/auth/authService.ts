import { 
  User, 
  Tokens, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  AUTH_STORAGE_KEYS 
} from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// API 에러 클래스
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP 클라이언트 유틸리티
class HttpClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 기본 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // 액세스 토큰이 있으면 헤더에 추가
    const accessToken = this.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || 'API 요청에 실패했습니다',
          data.code || 'UNKNOWN_ERROR',
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        '네트워크 오류가 발생했습니다',
        'NETWORK_ERROR',
        0
      );
    }
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const httpClient = new HttpClient();

// 인증 API 서비스
export class AuthService {
  // 회원가입
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/register', data);
    
    // 토큰과 사용자 정보를 로컬 스토리지에 저장
    this.saveTokens(response.data.tokens);
    this.saveUser(response.data.user);
    
    return response;
  }

  // 로그인
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/login', data);
    
    // 토큰과 사용자 정보를 로컬 스토리지에 저장
    this.saveTokens(response.data.tokens);
    this.saveUser(response.data.user);
    
    return response;
  }

  // 로그아웃
  static async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } catch (error) {
      // 로그아웃 API 실패해도 로컬 데이터는 제거
      console.warn('로그아웃 API 호출 실패:', error);
    } finally {
      this.clearAuth();
    }
  }

  // 내 정보 조회
  static async getMe(): Promise<{ user: User }> {
    const response = await httpClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
    
    // 사용자 정보 업데이트
    this.saveUser(response.data.user);
    
    return response.data;
  }

  // 프로필 업데이트
  static async updateProfile(data: UpdateProfileRequest): Promise<{ user: User }> {
    const response = await httpClient.put<{ success: boolean; data: { user: User } }>('/auth/profile', data);
    
    // 업데이트된 사용자 정보 저장
    this.saveUser(response.data.user);
    
    return response.data;
  }

  // 비밀번호 변경
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await httpClient.put('/auth/change-password', data);
    
    // 비밀번호 변경 후 로그아웃 (보안상)
    this.clearAuth();
  }

  // 토큰 갱신
  static async refreshToken(): Promise<Tokens> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new ApiError('리프레시 토큰이 없습니다', 'NO_REFRESH_TOKEN', 401);
    }

    const response = await httpClient.post<{ success: boolean; data: { tokens: Tokens } }>('/auth/refresh', {
      refreshToken,
    });
    
    // 새로운 토큰 저장
    this.saveTokens(response.data.tokens);
    
    return response.data.tokens;
  }

  // 로컬 스토리지 관련 메서드들
  static saveTokens(tokens: Tokens): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  static saveUser(user: User): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userJson = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  static getTokens(): Tokens | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    if (!accessToken || !refreshToken) return null;
    
    return { accessToken, refreshToken };
  }

  static clearAuth(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  }
}

export default AuthService;
