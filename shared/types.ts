// 기본 타입
export type SocialProvider = 'google' | 'naver' | 'kakao';
export type UserRole = 'student' | 'instructor' | 'admin';
export type Subscription = 'free' | 'premium' | 'enterprise';
export type ClassroomLevel = 'beginner' | 'intermediate' | 'advanced';
export type PostType = 'document' | 'video' | 'image' | 'code';
export type MessageType = 'text' | 'file' | 'image' | 'system';
export type FileType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';

// 사용자 관련
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  provider?: SocialProvider;
  providerId?: string;
  role: UserRole;
  subscription: Subscription;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  key: string;
  createdAt: string;
  usage: ApiUsage;
}

export interface ApiUsage {
  totalCalls: number;
  todayCalls: number;
  monthlyCalls: number;
  limit: number;
}

// 강의실 관련
export interface Classroom {
  id: string;
  name: string;
  description?: string;
  category: string;
  level: ClassroomLevel;
  ownerId: string;
  owner: User;
  isPublic: boolean;
  allowChat: boolean;
  likesCount: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomMembership {
  id: string;
  userId: string;
  classroomId: string;
  role: string;
  joinedAt: string;
  user: User;
  classroom: Classroom;
}

// 게시물 관련
export interface Post {
  id: string;
  title: string;
  content?: string;
  authorId: string;
  author: User;
  classroomId?: string;
  classroom?: Classroom;
  type: PostType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  tags: string[];
  likesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content?: string;
  tags?: string[];
  classroomId?: string;
  type: PostType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

// 메시지 관련
export interface Message {
  id: string;
  content: string;
  authorId: string;
  author: User;
  classroomId: string;
  classroom: Classroom;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  replyToId?: string;
  replyTo?: Message;
  replies: Message[];
  reads: MessageRead[];
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageRead {
  id: string;
  userId: string;
  messageId: string;
  readAt: string;
  user: User;
  message: Message;
}

export interface MessageReaction {
  id: string;
  userId: string;
  messageId: string;
  emoji: string;
  createdAt: string;
  user: User;
  message: Message;
}

// 파일 관련
export interface File {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  cloudinaryId?: string;
  type: FileType;
  categoryId?: string;
  category?: Category;
  tags: string[];
  uploadedById?: string;
  uploadedBy?: User;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// 좋아요 관련
export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
  user: User;
  post: Post;
}

export interface ClassroomLike {
  id: string;
  userId: string;
  classroomId: string;
  createdAt: string;
  user: User;
  classroom: Classroom;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 검색 관련
export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  type: 'POST' | 'FILE' | 'CLASSROOM';
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  relevanceScore: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

// RAG 관련
export interface RAGQuery {
  query: string;
  apiKey: string;
  limit?: number;
}

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
}

// 인증 관련
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  provider: SocialProvider;
  accessToken: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// 에러 타입
export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
}
