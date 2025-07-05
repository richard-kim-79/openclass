'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClassrooms } from '@/hooks/useClassrooms';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Search, 
  Plus,
  Star,
  Crown,
  UserCheck,
  Settings,
  ChevronRight,
  Calendar,
  Filter,
  BookmarkIcon,
  PlusCircle
} from 'lucide-react';

type TabType = 'created' | 'joined' | 'all';

export default function MyClassroomPage() {
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { data: classrooms, isLoading, error } = useClassrooms();

  // 더미 사용자 강의실 데이터
  const dummyMyClassrooms = {
    created: [
      {
        id: '1',
        name: 'JavaScript 마스터 클래스',
        description: 'JavaScript의 모든 것을 배우는 심화 과정입니다.',
        category: '프로그래밍',
        level: 'INTERMEDIATE',
        memberCount: 89,
        isActive: true,
        role: 'owner',
        instructor: user?.firstName || '김강사',
        thumbnail: null,
        createdAt: '2024-03-01',
        lastActivity: '2024-07-04',
        tags: ['JavaScript', 'ES6+', '고급'],
        rating: 4.8,
        revenue: 2670000,
        completionRate: 78
      },
      {
        id: '2',
        name: 'React 실무 프로젝트',
        description: '실제 서비스를 만들어보는 React 프로젝트 과정입니다.',
        category: '프론트엔드',
        level: 'ADVANCED',
        memberCount: 54,
        isActive: true,
        role: 'owner',
        instructor: user?.firstName || '김강사',
        thumbnail: null,
        createdAt: '2024-02-15',
        lastActivity: '2024-07-03',
        tags: ['React', 'Project', '실무'],
        rating: 4.9,
        revenue: 1620000,
        completionRate: 85
      }
    ],
    joined: [
      {
        id: '3',
        name: 'Python 데이터 사이언스',
        description: 'Python으로 배우는 데이터 분석과 머신러닝입니다.',
        category: '데이터사이언스',
        level: 'BEGINNER',
        memberCount: 234,
        isActive: true,
        role: 'student',
        instructor: '이데이터',
        thumbnail: null,
        createdAt: '2024-01-20',
        joinedAt: '2024-03-10',
        lastActivity: '2024-07-02',
        tags: ['Python', 'Data Science', 'ML'],
        rating: 4.7,
        progress: 65,
        completedLessons: 13,
        totalLessons: 20
      },
      {
        id: '4',
        name: 'UI/UX 디자인 기초',
        description: 'Figma를 활용한 UI/UX 디자인 입문 과정입니다.',
        category: '디자인',
        level: 'BEGINNER',
        memberCount: 156,
        isActive: true,
        role: 'student',
        instructor: '박디자인',
        thumbnail: null,
        createdAt: '2024-02-01',
        joinedAt: '2024-02-20',
        lastActivity: '2024-06-28',
        tags: ['UI', 'UX', 'Figma'],
        rating: 4.6,
        progress: 40,
        completedLessons: 8,
        totalLessons: 20
      },
      {
        id: '5',
        name: '알고리즘 문제해결',
        description: '코딩테스트 대비 알고리즘 문제해결 능력을 기릅니다.',
        category: '알고리즘',
        level: 'INTERMEDIATE',
        memberCount: 178,
        isActive: true,
        role: 'student',
        instructor: '최알고',
        thumbnail: null,
        createdAt: '2024-01-15',
        joinedAt: '2024-04-05',
        lastActivity: '2024-07-01',
        tags: ['Algorithm', 'Coding Test', 'Problem Solving'],
        rating: 4.8,
        progress: 25,
        completedLessons: 5,
        totalLessons: 20
      }
    ]
  };

  // 실제 데이터가 없으면 더미 데이터 사용
  const myClassrooms = dummyMyClassrooms;

  const getCurrentClassrooms = () => {
    if (activeTab === 'all') {
      return [...myClassrooms.created, ...myClassrooms.joined];
    }
    return myClassrooms[activeTab] || [];
  };

  const filteredClassrooms = getCurrentClassrooms().filter(classroom =>
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelLabel = (level: string) => {
    const labels = {
      'BEGINNER': '초급',
      'INTERMEDIATE': '중급',
      'ADVANCED': '고급'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'BEGINNER': 'bg-green-100 text-green-800',
      'INTERMEDIATE': 'bg-yellow-100 text-yellow-800',
      'ADVANCED': 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    return role === 'owner' ? <Crown className="h-4 w-4 text-yellow-500" /> : <UserCheck className="h-4 w-4 text-blue-500" />;
  };

  const getRoleLabel = (role: string) => {
    return role === 'owner' ? '강사' : '수강생';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">내 강의실을 보려면 먼저 로그인해주세요.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">내 강의실을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  내 강의실
                </h1>
                <p className="text-gray-600 mt-2">
                  안녕하세요, <span className="font-medium text-gray-800">{user.firstName}</span>님! 
                  내가 개설하고 참여하는 강의실을 관리해보세요.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/classroom/create'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                새 강의실 만들기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('created')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'created'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  내가 개설한 강의실 ({myClassrooms.created.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('joined')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'joined'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  내가 참여하는 강의실 ({myClassrooms.joined.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  전체 ({myClassrooms.created.length + myClassrooms.joined.length})
                </div>
              </button>
            </nav>
          </div>

          {/* 검색 */}
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="강의실 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">개설한 강의실</p>
                <p className="text-2xl font-bold text-gray-900">{myClassrooms.created.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">참여하는 강의실</p>
                <p className="text-2xl font-bold text-gray-900">{myClassrooms.joined.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 수강생</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myClassrooms.created.reduce((sum, c) => sum + c.memberCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">평균 평점</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getCurrentClassrooms().length > 0 
                    ? (getCurrentClassrooms().reduce((sum, c) => sum + (c.rating || 0), 0) / getCurrentClassrooms().length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 강의실 목록 */}
        {filteredClassrooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            {activeTab === 'created' ? (
              <>
                <PlusCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">개설한 강의실이 없습니다</h3>
                <p className="text-gray-600 mb-6">첫 번째 강의실을 만들어 지식을 공유해보세요!</p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  강의실 만들기
                </button>
              </>
            ) : (
              <>
                <BookmarkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">참여하는 강의실이 없습니다</h3>
                <p className="text-gray-600 mb-6">관심 있는 강의실에 참여해보세요!</p>
                <button 
                  onClick={() => window.location.href = '/classroom/explore'}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  강의실 둘러보기
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredClassrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => window.location.href = `/classroom/${classroom.id}`}
              >
                {/* 헤더 */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getRoleIcon(classroom.role)}
                        <span className="text-sm font-medium text-gray-600">
                          {getRoleLabel(classroom.role)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(classroom.level)}`}>
                          {getLevelLabel(classroom.level)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {classroom.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {classroom.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 콘텐츠 */}
                <div className="p-6">
                  {/* 통계 정보 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{classroom.memberCount}</div>
                      <div className="text-sm text-gray-600">수강생</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-2xl font-bold text-gray-900">{classroom.rating}</span>
                      </div>
                      <div className="text-sm text-gray-600">평점</div>
                    </div>
                  </div>

                  {/* 진행률 (수강생인 경우) */}
                  {classroom.role === 'student' && 'progress' in classroom && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>학습 진행률</span>
                        <span>{classroom.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${classroom.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {classroom.completedLessons}/{classroom.totalLessons} 강의 완료
                      </div>
                    </div>
                  )}

                  {/* 수익 정보 (강사인 경우) */}
                  {classroom.role === 'owner' && 'revenue' in classroom && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-800">이번 달 수익</span>
                        <span className="font-bold text-green-900">
                          ₩{classroom.revenue?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        완주율: {classroom.completionRate}%
                      </div>
                    </div>
                  )}

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {classroom.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {classroom.role === 'owner' 
                          ? `개설: ${new Date(classroom.createdAt).toLocaleDateString()}`
                          : `참여: ${new Date('joinedAt' in classroom ? classroom.joinedAt : classroom.createdAt).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>최근 활동: {new Date(classroom.lastActivity).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors group-hover:bg-blue-700 flex items-center justify-center gap-2">
                    <span>
                      {classroom.role === 'owner' ? '강의실 관리' : '강의실 입장'}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
