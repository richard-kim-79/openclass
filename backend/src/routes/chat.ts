import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiter';

const router = Router();

// 모든 채팅 라우트는 인증 필요
router.use(authMiddleware);

/**
 * @route   POST /api/chat/messages
 * @desc    메시지 생성
 * @access  Private
 * @body    { content: string, classroomId: string, type?: string, fileUrl?: string, fileName?: string, fileSize?: number, replyToId?: string }
 */
router.post('/messages', generalRateLimit, chatController.createMessage);

/**
 * @route   GET /api/chat/messages/:classroomId
 * @desc    메시지 목록 조회
 * @access  Private
 * @params  { classroomId: string }
 * @query   { limit?: number, before?: string }
 */
router.get('/messages/:classroomId', chatController.getMessages);

/**
 * @route   PUT /api/chat/messages/:messageId
 * @desc    메시지 수정
 * @access  Private
 * @params  { messageId: string }
 * @body    { content: string }
 */
router.put('/messages/:messageId', generalRateLimit, chatController.updateMessage);

/**
 * @route   DELETE /api/chat/messages/:messageId
 * @desc    메시지 삭제
 * @access  Private
 * @params  { messageId: string }
 */
router.delete('/messages/:messageId', chatController.deleteMessage);

/**
 * @route   POST /api/chat/messages/:messageId/read
 * @desc    메시지 읽음 처리
 * @access  Private
 * @params  { messageId: string }
 */
router.post('/messages/:messageId/read', chatController.markMessageAsRead);

/**
 * @route   POST /api/chat/messages/:messageId/reaction
 * @desc    메시지 반응 토글
 * @access  Private
 * @params  { messageId: string }
 * @body    { emoji: string }
 */
router.post('/messages/:messageId/reaction', chatController.toggleMessageReaction);

/**
 * @route   GET /api/chat/classrooms/:classroomId/users
 * @desc    강의실 온라인 사용자 목록 조회
 * @access  Private
 * @params  { classroomId: string }
 */
router.get('/classrooms/:classroomId/users', chatController.getOnlineUsers);

/**
 * @route   GET /api/chat/classrooms/:classroomId/unread-count
 * @desc    강의실 안읽은 메시지 수 조회
 * @access  Private
 * @params  { classroomId: string }
 */
router.get('/classrooms/:classroomId/unread-count', chatController.getUnreadMessageCount);

export { router as chatRoutes };
