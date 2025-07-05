import { Request, Response } from 'express';
import { userProfileService } from '../services/userProfileService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// 프로필 업데이트 스키마
const updateProfileSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.').max(50, '이름은 50자 이내여야 합니다.').optional(),
  bio: z.string().max(500, '자기소개는 500자 이내여야 합니다.').optional(),
  avatarUrl: z.string().url('올바른 URL 형식이어야 합니다.').optional()
});

// 사용자 프로필 조회
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    // 본인 프로필이 아닌 경우 제한적 정보만 제공
    if (userId !== currentUserId) {
      const profile = await userProfileService.getUserProfile(userId);

      return res.json({
        success: true,
        data: {
          profile: {
            id: profile.id,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            role: profile.role,
            createdAt: profile.createdAt,
            stats: {
              postsCount: profile.stats.postsCount,
              classroomsOwned: profile.stats.classroomsOwned,
              classroomsJoined: profile.stats.classroomsJoined
            }
          }
        },
        message: '사용자 프로필을 조회했습니다.'
      });
    }

    // 본인 프로필인 경우 모든 정보 제공
    const profile = await userProfileService.getUserProfile(userId);

    return res.json({
      success: true,
      data: { profile },
      message: '프로필을 조회했습니다.'
    });

  } catch (error) {
    logger.error('사용자 프로필 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// 현재 사용자 프로필 조회
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const profile = await userProfileService.getUserProfile(userId);

    return res.json({
      success: true,
      data: { profile },
      message: '내 프로필을 조회했습니다.'
    });

  } catch (error) {
    logger.error('내 프로필 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.'
    });
  }
};

// 사용자 활동 조회
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    // 본인 활동이 아닌 경우 제한적 정보만 제공
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: '본인의 활동만 조회할 수 있습니다.'
      });
    }

    const activity = await userProfileService.getUserActivity(userId);

    return res.json({
      success: true,
      data: { activity },
      message: '사용자 활동을 조회했습니다.'
    });

  } catch (error) {
    logger.error('사용자 활동 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '사용자 활동 조회 중 오류가 발생했습니다.'
    });
  }
};

// 내 활동 조회
export const getMyActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const activity = await userProfileService.getUserActivity(userId);

    return res.json({
      success: true,
      data: { activity },
      message: '내 활동을 조회했습니다.'
    });

  } catch (error) {
    logger.error('내 활동 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '활동 조회 중 오류가 발생했습니다.'
    });
  }
};

// 프로필 업데이트
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const profile = await userProfileService.updateProfile(userId, validatedData);

    return res.json({
      success: true,
      data: { profile },
      message: '프로필이 업데이트되었습니다.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        errors: error.errors
      });
    }

    logger.error('프로필 업데이트 오류:', error);
    return res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다.'
    });
  }
};

// 강의실 좋아요 토글
export const toggleClassroomLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { classroomId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const result = await userProfileService.toggleClassroomLike(userId, classroomId);

    return res.json({
      success: true,
      data: result,
      message: result.liked ? '강의실을 좋아요했습니다.' : '강의실 좋아요를 취소했습니다.'
    });

  } catch (error) {
    logger.error('강의실 좋아요 토글 오류:', error);
    return res.status(500).json({
      success: false,
      message: '강의실 좋아요 처리 중 오류가 발생했습니다.'
    });
  }
};

// 게시물 좋아요 토글
export const togglePostLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const result = await userProfileService.togglePostLike(userId, postId);

    return res.json({
      success: true,
      data: result,
      message: result.liked ? '게시물을 좋아요했습니다.' : '게시물 좋아요를 취소했습니다.'
    });

  } catch (error) {
    logger.error('게시물 좋아요 토글 오류:', error);
    return res.status(500).json({
      success: false,
      message: '게시물 좋아요 처리 중 오류가 발생했습니다.'
    });
  }
};

// 사용자 통계 조회
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    // 본인 또는 공개 프로필인 경우만 조회 가능
    const profile = await userProfileService.getUserProfile(userId);

    return res.json({
      success: true,
      data: { 
        stats: profile.stats,
        isOwnProfile: userId === currentUserId
      },
      message: '사용자 통계를 조회했습니다.'
    });

  } catch (error) {
    logger.error('사용자 통계 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '사용자 통계 조회 중 오류가 발생했습니다.'
    });
  }
};
