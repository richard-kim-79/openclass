import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 강의실 타입 정의
export interface Classroom {
  id: string;
  name: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  memberCount: number;
  isPopular?: boolean;
  rating?: number;
  instructor: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  owner?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface CreateClassroomData {
  name: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

// Get classrooms
export const useClassrooms = (params?: {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
}) => {
  return useQuery({
    queryKey: ['classrooms', params],
    queryFn: async () => {
      try {
        const response = await api.get('/classrooms', { params });
        return response.data?.data || [];
      } catch (error) {
        console.warn('강의실 데이터 로딩 실패, 더미 데이터 사용');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    retry: 1,
  });
};

// Get single classroom
export const useClassroom = (classroomId: string) => {
  return useQuery({
    queryKey: ['classrooms', classroomId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Classroom>>(`/classrooms/${classroomId}`);
      return response.data;
    },
    enabled: !!classroomId,
  });
};

// Create classroom
export const useCreateClassroom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateClassroomData) => {
      const response = await api.post<ApiResponse<Classroom>>('/classrooms', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('강의실이 성공적으로 생성되었습니다!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '강의실 생성에 실패했습니다.');
    },
  });
};

// Join classroom
export const useJoinClassroom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classroomId: string) => {
      const response = await api.post(`/classrooms/${classroomId}/join`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('강의실에 참여했습니다!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '강의실 참여에 실패했습니다.');
    },
  });
};

// Leave classroom
export const useLeaveClassroom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classroomId: string) => {
      const response = await api.post(`/classrooms/${classroomId}/leave`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('강의실에서 나갔습니다.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '강의실 나가기에 실패했습니다.');
    },
  });
};
