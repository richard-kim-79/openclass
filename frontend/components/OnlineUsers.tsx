'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Circle, 
  Crown, 
  GraduationCap, 
  ChevronDown, 
  ChevronRight,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { OnlineUser } from '@/lib/chatApi';

interface OnlineUsersProps {
  users: OnlineUser[];
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
  onInviteUser?: () => void;
  className?: string;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({
  users,
  currentUserId,
  onUserClick,
  onInviteUser,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const onlineUsers = users.filter(user => user.isOnline);
  const offlineUsers = users.filter(user => !user.isOnline);
  
  // 사용자 상태 아이콘
  const getStatusIcon = (user: OnlineUser) => {
    if (user.isOnline) {
      return <Circle className="w-3 h-3 text-green-500 fill-current" />;
    } else {
      return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };
  
  // 사용자 역할 아이콘
  const getRoleIcon = (userId: string) => {
    // 실제로는 사용자 역할 데이터에서 가져와야 합니다
    // 임시로 현재 사용자를 표시합니다
    if (userId === currentUserId) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    return <GraduationCap className="w-4 h-4 text-blue-500" />;
  };
  
  // 마지막 접속 시간 포맷
  const formatLastSeen = (lastSeenAt?: string) => {
    if (!lastSeenAt) return '';
    
    const now = new Date();
    const lastSeen = new Date(lastSeenAt);
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };
  
  // 사용자 아이템 렌더링
  const renderUser = (user: OnlineUser, isCurrentUser: boolean = false) => (
    <div
      key={user.id}
      className={`
        flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer
        ${isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
      `}
      onClick={() => onUserClick?.(user.id)}
    >
      {/* 아바타 */}
      <div className="relative">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* 온라인 상태 표시 */}
        <div className="absolute -bottom-1 -right-1">
          {getStatusIcon(user)}
        </div>
      </div>
      
      {/* 사용자 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {user.name}
            {isCurrentUser && <span className="text-blue-600"> (나)</span>}
          </span>
          {getRoleIcon(user.id)}
        </div>
        
        {!user.isOnline && user.lastSeenAt && (
          <div className="text-xs text-gray-500">
            {formatLastSeen(user.lastSeenAt)}
          </div>
        )}
      </div>
      
      {/* 액션 버튼 */}
      {!isCurrentUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUserClick?.(user.id);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="메시지 보내기"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
  
  return (
    <div className={`bg-white border-l border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 w-full text-left"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <Users className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">
            참여자 ({users.length})
          </span>
        </button>
        
        {/* 사용자 초대 버튼 */}
        {onInviteUser && (
          <button
            onClick={onInviteUser}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-sm">사용자 초대</span>
          </button>
        )}
      </div>
      
      {/* 사용자 목록 */}
      {isExpanded && (
        <div className="p-4 space-y-1 max-h-96 overflow-y-auto">
          {/* 온라인 사용자 */}
          {onlineUsers.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Circle className="w-3 h-3 text-green-500 fill-current" />
                <span className="text-sm font-medium text-gray-700">
                  온라인 ({onlineUsers.length})
                </span>
              </div>
              
              {onlineUsers.map(user => 
                renderUser(user, user.id === currentUserId)
              )}
            </div>
          )}
          
          {/* 오프라인 사용자 */}
          {offlineUsers.length > 0 && (
            <div className="space-y-1">
              {onlineUsers.length > 0 && (
                <div className="border-t border-gray-200 my-4" />
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <Circle className="w-3 h-3 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  오프라인 ({offlineUsers.length})
                </span>
              </div>
              
              {offlineUsers.map(user => 
                renderUser(user, user.id === currentUserId)
              )}
            </div>
          )}
          
          {/* 사용자가 없는 경우 */}
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">아직 참여자가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
