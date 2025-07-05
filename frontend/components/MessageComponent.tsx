'use client';

import React, { useState, useRef } from 'react';
import { 
  MessageCircle, 
  Reply, 
  Edit, 
  Trash2, 
  MoreVertical,
  File,
  Image,
  Download,
  Heart,
  Smile,
  Copy,
  Check,
  CheckCheck
} from 'lucide-react';
import { ChatMessage } from '@/lib/chatApi';
import { useAuth } from '@/hooks/useAuth';

interface MessageComponentProps {
  message: ChatMessage;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  showAvatar?: boolean;
  isLastMessage?: boolean;
  currentUserId?: string;
}

// 인기 이모지 리스트
const POPULAR_EMOJIS = ['👍', '❤️', '😄', '😮', '😢', '😡', '🎉', '🔥'];

export const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  onEdit,
  onDelete,
  onReply,
  onReaction,
  onMarkAsRead,
  showAvatar = true,
  isLastMessage = false,
  currentUserId
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  
  const isOwnMessage = user?.id?.toString() === message.authorId?.toString();
  const isSystemMessage = message.type === 'system';
  const isRead = message.reads.some(read => read.userId?.toString() === currentUserId?.toString());
  
  // 메시지 시간 포맷
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };
  
  // 메시지 편집 저장
  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };
  
  // 메시지 편집 취소
  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };
  
  // 메시지 복사
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('메시지 복사 실패:', error);
    }
  };
  
  // 이모지 반응 추가
  const handleEmojiReaction = (emoji: string) => {
    onReaction?.(message.id, emoji);
    setShowEmojiPicker(false);
  };
  
  // 파일 다운로드
  const handleFileDownload = () => {
    if (message.fileUrl) {
      window.open(message.fileUrl, '_blank');
    }
  };
  
  // 반응 그룹화
  const groupedReactions = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);
  
  // 시스템 메시지 렌더링
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`group relative ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} flex gap-3 px-4 py-2 hover:bg-gray-50 transition-colors`}>
      {/* 아바타 */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {message.author.avatarUrl ? (
            <img
              src={message.author.avatarUrl}
              alt={message.author.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {message.author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      {/* 메시지 내용 */}
      <div className={`flex-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
        {/* 작성자 정보 */}
        {showAvatar && (
          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-sm font-medium text-gray-900">
              {message.author.name}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="text-xs text-gray-400">(편집됨)</span>
            )}
          </div>
        )}
        
        {/* 답글 참조 */}
        {message.replyTo && (
          <div className={`mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500 ${isOwnMessage ? 'ml-4' : 'mr-4'}`}>
            <div className="text-xs text-gray-600 mb-1">
              {message.replyTo.author.name}에게 답글
            </div>
            <div className="text-sm text-gray-800 line-clamp-2">
              {message.replyTo.content}
            </div>
          </div>
        )}
        
        {/* 메시지 말풍선 */}
        <div className={`relative inline-block max-w-lg ${isOwnMessage ? 'ml-4' : 'mr-4'}`}>
          <div className={`
            px-4 py-2 rounded-2xl shadow-sm
            ${isOwnMessage 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-900 border border-gray-200'
            }
          `}>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-black resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 텍스트 메시지 */}
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                
                {/* 파일 첨부 */}
                {message.type === 'file' && message.fileUrl && (
                  <div className="mt-2 p-3 bg-black/10 rounded-lg flex items-center gap-2">
                    <File className="w-4 h-4" />
                    <span className="text-sm flex-1 truncate">
                      {message.fileName}
                    </span>
                    <button
                      onClick={handleFileDownload}
                      className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {/* 이미지 첨부 */}
                {message.type === 'image' && message.fileUrl && (
                  <div className="mt-2">
                    <img
                      src={message.fileUrl}
                      alt={message.fileName || '이미지'}
                      className="max-w-full max-h-60 rounded-lg cursor-pointer"
                      onClick={handleFileDownload}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* 메시지 액션 버튼 */}
          {!isEditing && (
            <div className={`
              absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity
              ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'}
            `}>
              <div className="flex items-center gap-1 bg-white shadow-lg rounded-lg p-1">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                  title="반응 추가"
                >
                  <Smile className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onReply?.(message.id)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                  title="답글"
                >
                  <Reply className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleCopyMessage}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                  title="복사"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                
                {isOwnMessage && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                      title="편집"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onDelete?.(message.id)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* 이모지 피커 */}
          {showEmojiPicker && (
            <div ref={emojiRef} className={`
              absolute top-full mt-2 bg-white shadow-lg rounded-lg p-2 z-10
              ${isOwnMessage ? 'right-0' : 'left-0'}
            `}>
              <div className="flex gap-1">
                {POPULAR_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 메시지 반응 */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={`mt-2 flex flex-wrap gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => handleEmojiReaction(emoji)}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-xs
                  ${reactions.some(r => r.userId?.toString() === user?.id?.toString())
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                title={reactions.map(r => r.user.name).join(', ')}
              >
                <span>{emoji}</span>
                <span>{reactions.length}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* 읽음 표시 */}
        {isOwnMessage && isLastMessage && (
          <div className={`mt-1 flex items-center gap-1 text-xs text-gray-500 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {isRead ? (
              <>
                <CheckCheck className="w-3 h-3 text-blue-500" />
                <span>읽음</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span>전송됨</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComponent;
