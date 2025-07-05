import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, UpdateProfileRequest } from '@/lib/profileApi';

// 내 프로필 조회 훅
export const useMyProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileApi.getMyProfile,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 내 활동 조회 훅
export const useMyActivity = () => {
  return useQuery({
    queryKey: ['profile', 'me', 'activity'],
    queryFn: profileApi.getMyActivity,
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 다른 사용자 프로필 조회 훅
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', 'user', userId],
    queryFn: () => profileApi.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 사용자 통계 조회 훅
export const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: ['profile', 'user', userId, 'stats'],
    queryFn: () => profileApi.getUserStats(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 프로필 업데이트 훅
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      // 프로필 캐시 업데이트
      queryClient.setQueryData(['profile', 'me'], data);
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: (error) => {
      console.error('프로필 업데이트 실패:', error);
    }
  });
};

// 강의실 좋아요 토글 훅
export const useToggleClassroomLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.toggleClassroomLike,
    onSuccess: (data, classroomId) => {
      // 내 활동 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'activity'] });
      
      // 강의실 관련 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ['classroom', classroomId] });
    },
    onError: (error) => {
      console.error('강의실 좋아요 토글 실패:', error);
    }
  });
};

// 게시물 좋아요 토글 훅
export const useTogglePostLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.togglePostLike,
    onSuccess: (data, postId) => {
      // 내 활동 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'activity'] });
      
      // 게시물 관련 캐시도 업데이트
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('게시물 좋아요 토글 실패:', error);
    }
  });
};

// 종합 프로필 훅 (프로필 + 활동)
export const useProfileWithActivity = () => {
  const profileQuery = useMyProfile();
  const activityQuery = useMyActivity();

  return {
    profile: profileQuery.data?.data?.profile,
    activity: activityQuery.data?.data?.activity,
    isLoading: profileQuery.isLoading || activityQuery.isLoading,
    error: profileQuery.error || activityQuery.error,
    refetch: () => {
      profileQuery.refetch();
      activityQuery.refetch();
    }
  };
};
