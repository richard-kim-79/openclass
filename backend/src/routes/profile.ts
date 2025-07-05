import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { authMiddleware } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiter';

const router = Router();

// 모든 프로필 라우트는 인증 필요
router.use(authMiddleware);

/**
 * @route   GET /api/profile/me
 * @desc    내 프로필 조회
 * @access  Private
 */
router.get('/me', profileController.getMyProfile);

/**
 * @route   GET /api/profile/me/activity
 * @desc    내 활동 조회
 * @access  Private
 */
router.get('/me/activity', profileController.getMyActivity);

/**
 * @route   PUT /api/profile/me
 * @desc    프로필 업데이트
 * @access  Private
 * @body    { name?: string, bio?: string, avatarUrl?: string }
 */
router.put('/me', generalRateLimit, profileController.updateProfile);

/**
 * @route   GET /api/profile/user/:userId
 * @desc    다른 사용자 프로필 조회 (공개 정보만)
 * @access  Private
 * @params  { userId: string }
 */
router.get('/user/:userId', profileController.getUserProfile);

/**
 * @route   GET /api/profile/user/:userId/activity
 * @desc    다른 사용자 활동 조회 (본인만 가능)
 * @access  Private
 * @params  { userId: string }
 */
router.get('/user/:userId/activity', profileController.getUserActivity);

/**
 * @route   GET /api/profile/user/:userId/stats
 * @desc    사용자 통계 조회
 * @access  Private
 * @params  { userId: string }
 */
router.get('/user/:userId/stats', profileController.getUserStats);

/**
 * @route   POST /api/profile/classroom/:classroomId/like
 * @desc    강의실 좋아요 토글
 * @access  Private
 * @params  { classroomId: string }
 */
router.post('/classroom/:classroomId/like', profileController.toggleClassroomLike);

/**
 * @route   POST /api/profile/post/:postId/like
 * @desc    게시물 좋아요 토글
 * @access  Private
 * @params  { postId: string }
 */
router.post('/post/:postId/like', profileController.togglePostLike);

export { router as profileRoutes };
