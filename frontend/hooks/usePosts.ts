import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Post, ApiResponse, PaginatedResponse, CreatePostData } from '@openclass/shared';
import toast from 'react-hot-toast';

// Get posts
export const usePosts = (params?: {
  page?: number;
  limit?: number;
  classroomId?: string;
  type?: string;
}) => {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Post>>('/posts', { params });
      return response.data;
    },
  });
};

// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await api.post<ApiResponse<Post>>('/posts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('게시물이 성공적으로 생성되었습니다!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '게시물 생성에 실패했습니다.');
    },
  });
};

// Like/unlike post
export const useLikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '좋아요 처리에 실패했습니다.');
    },
  });
};