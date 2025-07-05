import { io, Socket } from 'socket.io-client';
import { ChatMessage, OnlineUser } from './chatApi';

export interface ChatSocketEvents {
  // 연결 이벤트
  connected: (data: { userId: string; userName: string; message: string }) => void;
  error: (data: { message: string }) => void;
  
  // 사용자 이벤트
  user_joined: (data: { userId: string; userName: string; message: string }) => void;
  user_left: (data: { userId: string; userName: string; message: string }) => void;
  online_users: (data: { onlineUsers: OnlineUser[] }) => void;
  
  // 메시지 이벤트
  new_message: (data: { message: ChatMessage }) => void;
  message_edited: (data: { message: ChatMessage }) => void;
  message_deleted: (data: { messageId: string }) => void;
  message_read: (data: { messageId: string; userId: string; userName: string }) => void;
  
  // 반응 이벤트
  reaction_updated: (data: {
    messageId: string;
    emoji: string;
    userId: string;
    userName: string;
    added: boolean;
    reactionCount: number;
  }) => void;
  
  // 타이핑 이벤트
  user_typing: (data: { userId: string; userName: string; isTyping: boolean }) => void;
  
  // 시스템 메시지
  system_message: (data: { message: string; timestamp: string }) => void;
  private_message: (data: any) => void;
}

class ChatSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  // 연결
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token;
      this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001', {
        auth: { token },
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true
      });

      this.socket.on('connect', () => {
        console.log('✅ 채팅 서버에 연결되었습니다.');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ 채팅 서버 연결 실패:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 채팅 서버 연결이 끊어졌습니다:', reason);
      });

      // 모든 이벤트 리스너 등록
      this.registerEventListeners();
    });
  }

  // 연결 해제
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // 이벤트 리스너 등록
  private registerEventListeners() {
    if (!this.socket) return;

    // 기본 이벤트들
    const events: (keyof ChatSocketEvents)[] = [
      'connected',
      'error',
      'user_joined',
      'user_left',
      'online_users',
      'new_message',
      'message_edited',
      'message_deleted',
      'message_read',
      'reaction_updated',
      'user_typing',
      'system_message',
      'private_message'
    ];

    events.forEach(event => {
      this.socket!.on(event, (data: any) => {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
          eventListeners.forEach(listener => listener(data));
        }
      });
    });
  }

  // 이벤트 리스너 추가
  on<K extends keyof ChatSocketEvents>(
    event: K,
    listener: ChatSocketEvents[K]
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  // 이벤트 리스너 제거
  off<K extends keyof ChatSocketEvents>(
    event: K,
    listener: ChatSocketEvents[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // 강의실 입장
  joinClassroom(classroomId: string) {
    if (this.socket) {
      this.socket.emit('join_classroom', { classroomId });
    }
  }

  // 강의실 퇴장
  leaveClassroom() {
    if (this.socket) {
      this.socket.emit('leave_classroom');
    }
  }

  // 메시지 전송
  sendMessage(data: {
    content: string;
    classroomId: string;
    type?: 'text' | 'file' | 'image';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
  }) {
    if (this.socket) {
      this.socket.emit('send_message', data);
    }
  }

  // 메시지 수정
  editMessage(messageId: string, content: string) {
    if (this.socket) {
      this.socket.emit('edit_message', { messageId, content });
    }
  }

  // 메시지 삭제
  deleteMessage(messageId: string) {
    if (this.socket) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  // 메시지 읽음 처리
  markMessageAsRead(messageId: string) {
    if (this.socket) {
      this.socket.emit('mark_message_read', { messageId });
    }
  }

  // 메시지 반응 토글
  toggleReaction(messageId: string, emoji: string) {
    if (this.socket) {
      this.socket.emit('toggle_reaction', { messageId, emoji });
    }
  }

  // 타이핑 시작
  startTyping(classroomId: string) {
    if (this.socket) {
      this.socket.emit('typing_start', { classroomId });
    }
  }

  // 타이핑 종료
  stopTyping(classroomId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', { classroomId });
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// 전역 싱글톤 인스턴스
export const chatSocket = new ChatSocketClient();
