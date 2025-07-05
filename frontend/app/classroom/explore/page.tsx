'use client';

import React, { useState } from 'react';
import { useClassrooms } from '@/hooks/useClassrooms';
import { 
  BookOpen, 
  Users, 
  Search, 
  Filter,
  Star,
  TrendingUp,
  ChevronRight,
  Heart,
  Eye
} from 'lucide-react';

export default function ExploreClassroomPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState('popular');

  // 공개 강의실 더미 데이터
  const dummyPublicClassrooms = [
    {
      id: '101',
      name: 'Node.js 백엔드 개발',
      description: 'Express.js와 MongoDB를 활용한 실전 백엔드 개발 과정입니다.',
      category: '백엔드',
      level: 'INTERMEDIATE',
      memberCount: 342,
      isPopular: true,
      rating: 4.8,
      instructor: '김백엔드',
      price: 89000,
      createdAt: '2024-01-10',
      tags: ['Node.js', 'Express', 'MongoDB', 'API'],
      duration: '8주',
      lessonsCount: 32
    },
    {
      id: '102',
      name: 'Vue.js 완전 정복',
      description: 'Vue.js 3 Composition API부터 Nuxt.js까지 완전 마스터하는 과정입니다.',
      category: '프론트엔드',
      level: 'BEGINNER',
      memberCount: 198,
      isPopular: true,
      rating: 4.9,
      instructor: '박뷰개발',
      price: 79000,
      createdAt: '2024-02-05',
      tags: ['Vue.js', 'Nuxt.js', 'Composition API'],
      duration: '6주',
      lessonsCount: 24
    },
    {
      id: '103',
      name: '딥러닝 기초부터 응용까지',
      description: 'TensorFlow와 PyTorch를 활용한 딥러닝 실무 과정입니다.',
      category: '인공지능',
      level: 'ADVANCED',
      memberCount: 156,
      isPopular: false,
      rating: 4.7,
      instructor: '이딥러닝',
      price: 129000,
      createdAt: '2024-01-25',
      tags: ['Deep Learning', 'TensorFlow', 'PyTorch'],
      duration: '12주',
      lessonsCount: 48
    },
    {
      id: '104',
      name: 'AWS 클라우드 아키텍처',
      description: 'AWS 서비스를 활용한 확장 가능한 클라우드 인프라 구축을 학습합니다.',
      category: 'DevOps',
      level: 'INTERMEDIATE',
      memberCount: 234,
      isPopular: true,
      rating: 4.6,
      instructor: '최클라우드',
      price: 99000,
      createdAt: '2024-03-01',
      tags: ['AWS', 'Cloud', 'Infrastructure'],
      duration: '10주',
      lessonsCount: 40
    },
    {
      id: '105',
      name: '모바일 앱 개발 with Flutter',
      description: 'Flutter를 사용해 iOS/Android 앱을 동시에 개발하는 방법을 배웁니다.',
      category: '모바일',
      level: 'BEGINNER',
      memberCount: 287,
      isPopular: true,
      rating: 4.8,
      instructor: '정플러터',
      price: 85000,
      createdAt: '2024-02-20',
      tags: ['Flutter', 'Mobile', 'iOS', 'Android'],
      duration: '8주',
      lessonsCount: 36
    }
  ];

  // 필터링 및 정렬 로직
  const filteredClassrooms = dummyPublicClassrooms
    .filter(classroom => {
      const matchesSearch = classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           classroom.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           classroom.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || classroom.category === selectedCategory;
      const matchesLevel = selectedLevel === 'ALL' || classroom.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.memberCount - a.memberCount;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price':
          return a.price - b.price;
        default:
          return 0;
      }
    });

  const categories = ['ALL', '프론트엔드', '백엔드', '모바일', '인공지능', 'DevOps'];
  const levels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Eye className="h-8 w-8 text-blue-600" />
                  강의실 탐색
                </h1>
                <p className="text-gray-600 mt-2">다양한 분야의 강의를 발견하고 새로운 지식을 습득해보세요</p>
              </div>
              <button 
                onClick={() => window.location.href = '/classroom'}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                내 강의실
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="강의실, 강사, 기술 스택 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'ALL' ? '모든 분야' : category}
                  </option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'ALL' ? '모든 레벨' : getLevelLabel(level)}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="popular">인기순</option>
                <option value="rating">평점순</option>
                <option value="newest">최신순</option>
                <option value="price">가격순</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            총 <span className="font-medium text-gray-900">{filteredClassrooms.length}</span>개의 강의실을 찾았습니다
          </div>
        </div>

        {/* 강의실 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
              onClick={() => window.location.href = `/classroom/${classroom.id}`}
            >
              {/* 썸네일 */}
              <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-20" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {classroom.isPopular && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      인기
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(classroom.level)}`}>
                    {getLevelLabel(classroom.level)}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <button className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors">
                    <Heart className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm opacity-90">{classroom.category}</p>
                  <h3 className="text-lg font-bold line-clamp-2">{classroom.name}</h3>
                </div>
              </div>

              {/* 내용 */}
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {classroom.description}
                </p>

                {/* 강사 및 평점 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{classroom.instructor[0]}</span>
                    </div>
                    <span className="text-sm text-gray-700">{classroom.instructor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{classroom.rating}</span>
                  </div>
                </div>

                {/* 통계 정보 */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{classroom.memberCount}</div>
                    <div className="text-xs text-gray-500">수강생</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{classroom.lessonsCount}</div>
                    <div className="text-xs text-gray-500">강의</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{classroom.duration}</div>
                    <div className="text-xs text-gray-500">기간</div>
                  </div>
                </div>

                {/* 가격 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₩{classroom.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ₩{Math.round(classroom.price * 1.3).toLocaleString()}
                    </span>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    23% 할인
                  </span>
                </div>

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

                {/* 액션 버튼 */}
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <span>강의실 참여하기</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>미리보기</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 샘플 데이터 알림 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800 text-sm">
            🌟 현재 샘플 강의실을 표시하고 있습니다. 실제 강의실 데이터를 보려면 백엔드 서버를 시작해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
