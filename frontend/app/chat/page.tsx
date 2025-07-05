'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  Users, 
  Settings, 
  Plus,
  Search,
  Hash,
  Bell,
  BellOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ChatRoom from '@/components/ChatRoom';

// 임시 강의실 데이터 (실제로는 API에서 가져와야 함)
const MOCK_CLASSROOMS = [
  {
    id: 'classroom-1',
    name: 'JavaScript 기초',
    description: 'JavaScript 기초 문법과 개념을 학습하는 강의실',
    memberCount: 24,
    unreadCount: 3,
    isActive: true,
    lastMessage: {
      content: '오늘 과제 어려우시나요?',
      author: '김선생',
      timestamp: '2024-01-15T10:30:00Z'
    }
  },
  {
    id: 'classroom-2',
    name: 'React 심화',
    description: 'React 고급 기능과 최적화 기법',
    memberCount: 18,
    unreadCount: 0,
    isActive: true,
    lastMessage: {
      content: 'useCallback과 useMemo의 차이점을 설명해주세요',
      author: '박학생',
      timestamp: '2024-01-15T09:15:00Z'
    }
  },
  {
    id: 'classroom-3',
    name: 'Node.js 백엔드',
    description: 'Node.js와 Express를 활용한 백엔드 개발',
    memberCount: 31,
    unreadCount: 7,
    isActive: true,
    lastMessage: {
      content: 'API 설계 관련 질문이 있습니다',
      author: '이개발',
      timestamp: '2024-01-15T08:45:00Z'
    }
  }
];

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [showUsersList, setShowUsersList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(true);
  
  // 인증 확인
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // 첫 번째 강의실 자동 선택
  useEffect(() => {
    if (MOCK_CLASSROOMS.length > 0 && !selectedClassroom) {
      setSelectedClassroom(MOCK_CLASSROOMS[0].id);
    }
  }, [selectedClassroom]);
  
  // 강의실 필터링
  const filteredClassrooms = MOCK_CLASSROOMS.filter(classroom =>
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };
  
  // 선택된 강의실 정보
  const selectedClassroomData = MOCK_CLASSROOMS.find(c => c.id === selectedClassroom);
  
  if (!user) {
    return null; // 로딩 중이거나 리다이렉트 중
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 - 강의실 목록 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">채팅</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotifications(!notifications)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title={notifications ? '알림 끄기' : '알림 켜기'}
              >
                {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* 검색 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="강의실 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* 강의실 목록 */}
        <div className="flex-1 overflow-y-auto">
          {filteredClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              onClick={() => setSelectedClassroom(classroom.id)}
              className={`
                p-4 border-b border-gray-100 cursor-pointer transition-colors
                ${selectedClassroom === classroom.id 
                  ? 'bg-blue-50 border-r-4 border-r-blue-500' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Hash className="w-5 h-5 text-gray-500 mt-1" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {classroom.name}
                    </h3>
                    {classroom.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {classroom.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Users className="w-3 h-3" />
                    <span>{classroom.memberCount}명</span>
                    <span>•</span>
                    <span>{formatTime(classroom.lastMessage.timestamp)}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate">
                    <span className="font-medium">{classroom.lastMessage.author}:</span>
                    {' '}
                    {classroom.lastMessage.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* 새 강의실 추가 */}
          <div className="p-4">
            <button className="w-full flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
              <Plus className="w-5 h-5" />
              <span>새 강의실 참여</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {selectedClassroomData ? (
          <ChatRoom
            classroomId={selectedClassroomData.id}
            classroomName={selectedClassroomData.name}
            showUsersList={showUsersList}
            onToggleUsersList={() => setShowUsersList(!showUsersList)}
            onSettingsClick={() => {
              console.log('채팅방 설정 클릭');
            }}
            className="flex-1"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                채팅을 시작해보세요
              </h2>
              <p className="text-gray-600">
                왼쪽에서 강의실을 선택하여 대화에 참여하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
