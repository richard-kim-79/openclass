import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // 토큰 확인 로직 (추후 구현)
    const token = localStorage.getItem('token');
    
    if (token) {
      // 임시 사용자 데이터
      setAuthState({
        user: {
          id: 1,
          email: 'demo@openclass.ai',
          username: 'demo',
          firstName: 'Demo',
          lastName: 'User',
          role: 'student'
        },
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    // 임시 로그인 로직
    localStorage.setItem('token', 'demo-token');
    setAuthState({
      user: {
        id: 1,
        email,
        username: 'demo',
        firstName: 'Demo',
        lastName: 'User',
        role: 'student'
      },
      isAuthenticated: true,
      isLoading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout
  };
};

// 인증이 필요한 페이지를 위한 훅
export const useRequireAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  return { user, isAuthenticated, isLoading };
};

// 게스트만 접근 가능한 페이지를 위한 훅
export const useGuestOnly = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // 대시보드로 리다이렉트
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
};
