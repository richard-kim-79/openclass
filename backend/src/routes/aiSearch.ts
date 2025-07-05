import { Router } from 'express';
import * as aiSearchController from '../controllers/aiSearchController';
import { authMiddleware } from '../middleware/auth';
import { aiSearchRateLimit, aiOperationRateLimit } from '../middleware/rateLimiter';

const router = Router();

// AI 검색 관련 라우트

/**
 * @route   POST /api/ai-search/search
 * @desc    AI 기반 스마트 검색 수행
 * @access  Public (하지만 rate limited)
 * @body    { query: string, type?: string, limit?: number, includeAISummary?: boolean }
 */
router.post('/search', aiSearchRateLimit, aiSearchController.search);

/**
 * @route   GET /api/ai-search/suggestions
 * @desc    검색어 자동완성 제안
 * @access  Public
 * @query   { query: string }
 */
router.get('/suggestions', aiSearchController.getSuggestions);

/**
 * @route   POST /api/ai-search/auto-tags
 * @desc    콘텐츠 기반 자동 태그 생성
 * @access  Private (로그인 필요)
 * @body    { content: string }
 */
router.post('/auto-tags', authMiddleware, aiOperationRateLimit, aiSearchController.generateAutoTags);

/**
 * @route   GET /api/ai-search/popular
 * @desc    인기 검색어 조회
 * @access  Public
 */
router.get('/popular', aiSearchController.getPopularSearches);

/**
 * @route   GET /api/ai-search/stats
 * @desc    검색 통계 조회 (관리자용)
 * @access  Admin only
 */
router.get('/stats', authMiddleware, aiSearchController.getSearchStats);

export { router as aiSearchRoutes };
