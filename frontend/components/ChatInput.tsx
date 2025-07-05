'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Image, 
  X, 
  Smile,
  Mic,
  MicOff
} from 'lucide-react';
import { useTypingIndicator } from '@/hooks/useChat';

interface ChatInputProps {
  onSendMessage: (content: string, replyToId?: string) => void;
  onSendFile?: (file: File) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  };
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendFile,
  onStartTyping,
  onStopTyping,
  replyTo,
  onCancelReply,
  placeholder = "메시지를 입력하세요...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // 타이핑 상태 관리
  const handleTyping = useTypingIndicator(onStartTyping, onStopTyping, 1000);
  
  // 메시지 전송
  const handleSendMessage = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), replyTo?.id);
      setMessage('');
      onCancelReply?.();
      
      // 텍스트 영역 높이 리셋
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, disabled, onSendMessage, replyTo?.id, onCancelReply]);
  
  // 텍스트 영역 높이 자동 조절
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 최대 높이 제한
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);
  
  // 메시지 입력 처리
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    adjustTextareaHeight();
    
    // 타이핑 상태 전송
    if (value.trim()) {
      handleTyping();
    }
  };
  
  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file);
      e.target.value = ''; // 파일 입력 초기화
    }
  };
  
  // 이미지 선택 처리
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file);
      e.target.value = ''; // 파일 입력 초기화
    }
  };
  
  // 이모지 추가
  const handleEmojiAdd = (emoji: string) => {
    const newMessage = message + emoji;
    setMessage(newMessage);
    setShowEmojiPicker(false);
    
    // 포커스 유지
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // 음성 녹음 시작/중지
  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // TODO: 음성 녹음 기능 구현
  };
  
  // 일반적인 이모지들
  const commonEmojis = [
    '😀', '😂', '😊', '😍', '🤔', '😮', '😢', '😡',
    '👍', '👎', '👌', '✌️', '🤞', '💪', '🙏', '❤️',
    '🎉', '🎊', '🔥', '⭐', '💯', '✨', '🎯', '🚀'
  ];
  
  return (
    <div className="border-t border-gray-200 bg-white">
      {/* 답글 표시 */}
      {replyTo && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm text-blue-600 font-medium">
              {replyTo.author}에게 답글
            </div>
            <div className="text-sm text-gray-600 truncate">
              {replyTo.content}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-blue-100 rounded text-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* 메인 입력 영역 */}
      <div className="px-4 py-3">
        <div className="flex items-end gap-2">
          {/* 첨부 파일 버튼 */}
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="파일 첨부"
              disabled={disabled}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="이미지 첨부"
              disabled={disabled}
            >
              <Image className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="이모지"
              disabled={disabled}
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          {/* 텍스트 입력 영역 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '40px' }}
            />
            
            {/* 이모지 피커 */}
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                <div className="grid grid-cols-8 gap-1 max-w-64">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiAdd(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 음성 녹음 버튼 */}
          <button
            onClick={handleVoiceRecord}
            className={`p-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={isRecording ? '녹음 중지' : '음성 녹음'}
            disabled={disabled}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {/* 전송 버튼 */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || disabled}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="메시지 전송"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
};

export default ChatInput;
