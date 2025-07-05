import { api } from './api';

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  classroomId: string;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    isOnline: boolean;
  };
  replyTo?: {
    id: string;
    content: string;
    author: {
      name: string;
    };
  };
  reads: {
    userId: string;
    readAt: string;
  }[];
  reactions: {
    userId: string;
    emoji: string;
    user: {
      name: string;
    };
  }[];
}

export interface OnlineUser {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface CreateMessageRequest {
  content: string;
  classroomId: string;
  type?: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface MessageReactionRequest {
  emoji: string;
}

export const chatApi = {
  // 메시지 생성
  createMessage: async (data: CreateMessageRequest) => {
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  // 메시지 목록 조회
  getMessages: async (classroomId: string, limit?: number, before?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    
    const response = await api.get(`/chat/messages/${classroomId}?${params}`);
    return response.data;
  },

  // 메시지 수정
  updateMessage: async (messageId: string, data: UpdateMessageRequest) => {
    const response = await api.put(`/chat/messages/${messageId}`, data);
    return response.data;
  },

  // 메시지 삭제
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },

  // 메시지 읽음 처리
  markMessageAsRead: async (messageId: string) => {
    const response = await api.post(`/chat/messages/${messageId}/read`);
    return response.data;
  },

  // 메시지 반응 토글
  toggleMessageReaction: async (messageId: string, data: MessageReactionRequest) => {
    const response = await api.post(`/chat/messages/${messageId}/reaction`, data);
    return response.data;
  },

  // 온라인 사용자 목록 조회
  getOnlineUsers: async (classroomId: string) => {
    const response = await api.get(`/chat/classrooms/${classroomId}/users`);
    return response.data;
  },

  // 안읽은 메시지 수 조회
  getUnreadMessageCount: async (classroomId: string) => {
    const response = await api.get(`/chat/classrooms/${classroomId}/unread-count`);
    return response.data;
  }
};
