'use client';

import { MainLayout } from '@/components/common/MainLayout';
import { useRequireAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useRequireAuth가 리다이렉트 처리
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">대시보드</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              안녕하세요, {user?.firstName}님! 👋
            </h2>
            <p className="text-blue-700">
              OpenClass에 오신 것을 환영합니다. 
              {user?.role === 'admin' && ' 관리자로 로그인하셨습니다.'}
              {user?.role === 'instructor' && ' 강사로 로그인하셨습니다.'}
              {user?.role === 'student' && ' 학생으로 로그인하셨습니다.'}
            </p>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold">내 강의실</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-blue-100 text-sm">참여 중인 강의실</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold">학습 자료</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-green-100 text-sm">업로드한 자료</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold">활동 점수</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-purple-100 text-sm">이번 주 활동</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
