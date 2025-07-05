import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, ChatMessage, OnlineUser, CreateMessageRequest } from '@/lib/chatApi';
import { chatSocket } from '@/lib/chatSocket';
import { useAuth } from './useAuth';

// 채팅 메시지 훅
export const useChatMessages = (classroomId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['chatMessages', classroomId],
    queryFn: () => chatApi.getMessages(classroomId),
    enabled: !!user && !!classroomId,
    staleTime: 0, // 항상 최신 데이터 확인
    refetchOnWindowFocus: false, // Socket.IO로 실시간 업데이트하므로 불필요
  });
};

// 메시지 전송 훅
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatApi.createMessage,
    onSuccess: (data, variables) => {
      // 캐시 업데이트는 Socket.IO 이벤트에서 처리
      console.log('메시지 전송 성공:', data);
    },
    onError: (error) => {
      console.error('메시지 전송 실패:', error);
    }
  });
};

// 온라인 사용자 목록 훅
export const useOnlineUsers = (classroomId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['onlineUsers', classroomId],
    queryFn: () => chatApi.getOnlineUsers(classroomId),
    enabled: !!user && !!classroomId,
    refetchInterval: 30000, // 30초마다 새로고침
  });
};

// 통합 채팅 룸 훅
export const useChatRoom = (classroomId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // 초기 메시지 로드
  const { data: initialMessages, isLoading } = useChatMessages(classroomId);
  
  // 소켓 연결 및 이벤트 리스너 설정
  useEffect(() => {
    if (!user || !classroomId) return;
    
    const connectSocket = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        if (!chatSocket.isConnected()) {
          await chatSocket.connect(token);
        }
        
        chatSocket.joinClassroom(classroomId);
        setIsConnected(true);
        
        // 이벤트 리스너 등록
        chatSocket.on('connected', (data) => {
          console.log('채팅 연결됨:', data);
          setIsConnected(true);
        });
        
        chatSocket.on('new_message', (data) => {
          setMessages(prev => [...prev, data.message]);
          
          // 다른 사용자의 메시지인 경우 안읽은 메시지 수 증가
          if (data.message.authorId?.toString() !== user.id?.toString()) {
            setUnreadCount(prev => prev + 1);
          }
        });
        
        chatSocket.on('message_edited', (data) => {
          setMessages(prev => prev.map(msg => 
            msg.id === data.message.id ? data.message : msg
          ));
        });
        
        chatSocket.on('message_deleted', (data) => {
          setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        });
        
        chatSocket.on('online_users', (data) => {
          setOnlineUsers(data.onlineUsers);
        });
        
        chatSocket.on('user_joined', (data) => {
          console.log('사용자 입장:', data);
          // 온라인 사용자 목록 새로고침
          queryClient.invalidateQueries({ queryKey: ['onlineUsers', classroomId] });
        });
        
        chatSocket.on('user_left', (data) => {
          console.log('사용자 퇴장:', data);
          // 온라인 사용자 목록 새로고침
          queryClient.invalidateQueries({ queryKey: ['onlineUsers', classroomId] });
        });
        
        chatSocket.on('user_typing', (data) => {
          const timeoutKey = data.userId;
          
          if (data.isTyping) {
            setTypingUsers(prev => new Set(prev).add(data.userName));
            
            // 기존 타이머 클리어
            const existingTimeout = typingTimeoutRef.current.get(timeoutKey);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            // 3초 후 타이핑 상태 제거
            const timeout = setTimeout(() => {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.userName);
                return newSet;
              });
              typingTimeoutRef.current.delete(timeoutKey);
            }, 3000);
            
            typingTimeoutRef.current.set(timeoutKey, timeout);
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userName);
              return newSet;
            });
            
            // 타이머 클리어
            const existingTimeout = typingTimeoutRef.current.get(timeoutKey);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              typingTimeoutRef.current.delete(timeoutKey);
            }
          }
        });
        
        chatSocket.on('reaction_updated', (data) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.messageId) {
              // 반응 업데이트 로직
              const reactions = msg.reactions.filter(r => 
                !(r.userId === data.userId && r.emoji === data.emoji)
              );
              
              if (data.added) {
                reactions.push({
                  userId: data.userId,
                  emoji: data.emoji,
                  user: { name: data.userName }
                });
              }
              
              return { ...msg, reactions };
            }
            return msg;
          }));
        });
        
        chatSocket.on('error', (data) => {
          console.error('채팅 오류:', data);
        });
        
      } catch (error) {
        console.error('소켓 연결 실패:', error);
        setIsConnected(false);
      }
    };
    
    connectSocket();
    
    return () => {
      chatSocket.leaveClassroom();
      // 타이머 정리
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [user, classroomId, queryClient]);
  
  // 초기 메시지 설정
  useEffect(() => {
    if (initialMessages?.data?.messages) {
      setMessages(initialMessages.data.messages);
    }
  }, [initialMessages]);
  
  // 메시지 전송
  const sendMessage = useCallback((content: string, replyToId?: string) => {
    if (!content.trim() || !classroomId) return;
    
    chatSocket.sendMessage({
      content: content.trim(),
      classroomId,
      type: 'text',
      replyToId
    });
  }, [classroomId]);
  
  // 파일 메시지 전송
  const sendFileMessage = useCallback((fileUrl: string, fileName: string, fileSize: number) => {
    if (!fileUrl || !classroomId) return;
    
    chatSocket.sendMessage({
      content: `파일을 공유했습니다: ${fileName}`,
      classroomId,
      type: 'file',
      fileUrl,
      fileName,
      fileSize
    });
  }, [classroomId]);
  
  // 메시지 수정
  const editMessage = useCallback((messageId: string, content: string) => {
    chatSocket.editMessage(messageId, content);
  }, []);
  
  // 메시지 삭제
  const deleteMessage = useCallback((messageId: string) => {
    chatSocket.deleteMessage(messageId);
  }, []);
  
  // 메시지 반응 토글
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    chatSocket.toggleReaction(messageId, emoji);
  }, []);
  
  // 타이핑 상태 전송
  const startTyping = useCallback(() => {
    if (classroomId) {
      chatSocket.startTyping(classroomId);
    }
  }, [classroomId]);
  
  const stopTyping = useCallback(() => {
    if (classroomId) {
      chatSocket.stopTyping(classroomId);
    }
  }, [classroomId]);
  
  // 메시지 읽음 처리
  const markMessageAsRead = useCallback((messageId: string) => {
    chatSocket.markMessageAsRead(messageId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);
  
  return {
    // 상태
    messages,
    onlineUsers,
    typingUsers: Array.from(typingUsers),
    isConnected,
    isLoading,
    unreadCount,
    
    // 액션
    sendMessage,
    sendFileMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    startTyping,
    stopTyping,
    markMessageAsRead,
    
    // 유틸리티
    hasMessages: messages.length > 0
  };
};

// 타이핑 디바운스 훅
export const useTypingIndicator = (
  startTyping: () => void,
  stopTyping: () => void,
  delay: number = 1000
) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      startTyping();
      isTypingRef.current = true;
    }
    
    // 기존 타이머 클리어
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 새 타이머 설정
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      isTypingRef.current = false;
    }, delay);
  }, [startTyping, stopTyping, delay]);
  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        stopTyping();
      }
    };
  }, [stopTyping]);
  
  return handleTyping;
};
