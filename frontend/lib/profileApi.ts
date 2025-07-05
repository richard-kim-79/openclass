import { api } from './api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    postsCount: number;
    filesCount: number;
    likesGiven: number;
    likesReceived: number;
    classroomsOwned: number;
    classroomsJoined: number;
    classroomsLiked: number;
    messagesCount: number;
  };
}

export interface UserPost {
  id: string;
  title: string;
  content?: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  likesCount: number;
  viewsCount: number;
  createdAt: string;
  classroom?: {
    id: string;
    name: string;
  };
}

export interface LikedPost {
  id: string;
  title: string;
  content?: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  likesCount: number;
  viewsCount: number;
  createdAt: string;
  likedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  classroom?: {
    id: string;
    name: string;
  };
}

export interface LikedClassroom {
  id: string;
  name: string;
  description?: string;
  category: string;
  level: string;
  likesCount: number;
  memberCount: number;
  postsCount: number;
  likedAt: string;
  owner: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface UploadedFile {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  viewsCount: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
}

export interface UserActivity {
  posts: UserPost[];
  likedPosts: LikedPost[];
  likedClassrooms: LikedClassroom[];
  uploadedFiles: UploadedFile[];
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export const profileApi = {
  // 내 프로필 조회
  getMyProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  // 내 활동 조회
  getMyActivity: async () => {
    const response = await api.get('/profile/me/activity');
    return response.data;
  },

  // 프로필 업데이트
  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put('/profile/me', data);
    return response.data;
  },

  // 다른 사용자 프로필 조회
  getUserProfile: async (userId: string) => {
    const response = await api.get(`/profile/user/${userId}`);
    return response.data;
  },

  // 사용자 통계 조회
  getUserStats: async (userId: string) => {
    const response = await api.get(`/profile/user/${userId}/stats`);
    return response.data;
  },

  // 강의실 좋아요 토글
  toggleClassroomLike: async (classroomId: string) => {
    const response = await api.post(`/profile/classroom/${classroomId}/like`);
    return response.data;
  },

  // 게시물 좋아요 토글
  togglePostLike: async (postId: string) => {
    const response = await api.post(`/profile/post/${postId}/like`);
    return response.data;
  }
};
