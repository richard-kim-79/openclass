'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Hash, 
  Settings, 
  Search,
  Pin,
  X,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useChatRoom } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import MessageComponent from './MessageComponent';
import ChatInput from './ChatInput';
import OnlineUsers from './OnlineUsers';

interface ChatRoomProps {
  classroomId: string;
  classroomName: string;
  showUsersList?: boolean;
  onToggleUsersList?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  classroomId,
  classroomName,
  showUsersList = true,
  onToggleUsersList,
  onSettingsClick,
  className = ''
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    author: string;
  } | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // 채팅룸 훅 사용
  const {
    messages,
    onlineUsers,
    typingUsers: socketTypingUsers,
    isConnected,
    isLoading,
    unreadCount,
    sendMessage,
    sendFileMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    startTyping,
    stopTyping,
    markMessageAsRead,
    hasMessages
  } = useChatRoom(classroomId);
  
  // 메시지 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 타이핑 사용자 업데이트
  useEffect(() => {
    setTypingUsers(socketTypingUsers);
  }, [socketTypingUsers]);
  
  // 메시지 전송 핸들러
  const handleSendMessage = (content: string, replyToId?: string) => {
    sendMessage(content, replyToId);
    setReplyTo(null);
  };
  
  // 파일 전송 핸들러
  const handleSendFile = async (file: File) => {
    // TODO: 파일 업로드 로직 구현
    console.log('파일 전송:', file);
    // 임시로 파일 정보만 전송
    sendMessage(`파일을 공유했습니다: ${file.name}`);
  };
  
  // 답글 설정
  const handleReply = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setReplyTo({
        id: messageId,
        content: message.content,
        author: message.author.name
      });
    }
  };
  
  // 메시지 수정
  const handleEditMessage = (messageId: string, content: string) => {
    editMessage(messageId, content);
  };
  
  // 메시지 삭제
  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm('메시지를 삭제하시겠습니까?')) {
      deleteMessage(messageId);
    }
  };
  
  // 메시지 반응
  const handleReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
  };
  
  // 검색 필터링
  const filteredMessages = messages.filter(message =>
    !searchQuery || message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 사용자 클릭 핸들러
  const handleUserClick = (userId: string) => {
    console.log('사용자 클릭:', userId);
    // TODO: 사용자 프로필 보기 또는 개인 메시지 기능
  };
  
  // 연결 상태 표시
  const getConnectionStatus = () => {
    if (!isConnected) {
      return {
        icon: <WifiOff className="w-4 h-4 text-red-500" />,
        text: '연결 끊김',
        color: 'text-red-500'
      };
    }
    
    return {
      icon: <Wifi className="w-4 h-4 text-green-500" />,
      text: '연결됨',
      color: 'text-green-500'
    };
  };
  
  const connectionStatus = getConnectionStatus();
  
  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-gray-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {classroomName}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {connectionStatus.icon}
              <span className={connectionStatus.color}>
                {connectionStatus.text}
              </span>
              {onlineUsers.length > 0 && (
                <span className="text-gray-500">
                  • {onlineUsers.length}명 온라인
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 검색 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="메시지 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* 사용자 목록 토글 */}
          {onToggleUsersList && (
            <button
              onClick={onToggleUsersList}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="사용자 목록 토글"
            >
              <Hash className="w-5 h-5" />
            </button>
          )}
          
          {/* 설정 */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 메시지 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 메시지 목록 */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {/* 로딩 상태 */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">메시지를 불러오는 중...</span>
              </div>
            )}
            
            {/* 연결 오류 */}
            {!isConnected && !isLoading && (
              <div className="flex items-center justify-center py-8 text-red-500">
                <AlertCircle className="w-6 h-6" />
                <span className="ml-2">채팅 서버에 연결할 수 없습니다.</span>
              </div>
            )}
            
            {/* 메시지 없음 */}
            {!isLoading && !hasMessages && (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <div className="text-center">
                  <Hash className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">채팅을 시작해보세요!</p>
                  <p className="text-sm">첫 번째 메시지를 보내서 대화를 시작하세요.</p>
                </div>
              </div>
            )}
            
            {/* 메시지 목록 */}
            {filteredMessages.map((message, index) => {
              const isLastMessage = index === filteredMessages.length - 1;
              const showAvatar = index === 0 || 
                filteredMessages[index - 1].authorId !== message.authorId ||
                (new Date(message.createdAt).getTime() - new Date(filteredMessages[index - 1].createdAt).getTime()) > 5 * 60 * 1000; // 5분 차이
              
              return (
                <MessageComponent
                  key={message.id}
                  message={message}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onReply={handleReply}
                  onReaction={handleReaction}
                  onMarkAsRead={markMessageAsRead}
                  showAvatar={showAvatar}
                  isLastMessage={isLastMessage}
                  currentUserId={user?.id?.toString()}
                />
              );
            })}
            
            {/* 타이핑 상태 표시 */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-gray-500 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>
                  {typingUsers.join(', ')}
                  {typingUsers.length === 1 ? '님이' : '님들이'} 입력 중...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* 채팅 입력 */}
          <ChatInput
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            onStartTyping={startTyping}
            onStopTyping={stopTyping}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={!isConnected}
          />
        </div>
        
        {/* 사용자 목록 */}
        {showUsersList && (
          <OnlineUsers
            users={onlineUsers}
            currentUserId={user?.id?.toString()}
            onUserClick={handleUserClick}
            className="w-64 flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
