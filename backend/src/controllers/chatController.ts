import { Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// 메시지 생성 스키마
const createMessageSchema = z.object({
  content: z.string().min(1, '메시지 내용을 입력하세요.').max(2000, '메시지가 너무 깁니다.'),
  classroomId: z.string().cuid('올바른 강의실 ID를 입력하세요.'),
  type: z.enum(['text', 'file', 'image', 'system']).optional().default('text'),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  replyToId: z.string().cuid().optional()
});

// 메시지 수정 스키마
const updateMessageSchema = z.object({
  content: z.string().min(1, '메시지 내용을 입력하세요.').max(2000, '메시지가 너무 깁니다.')
});

// 메시지 반응 스키마
const messageReactionSchema = z.object({
  emoji: z.string().min(1, '이모지를 선택하세요.')
});

// 메시지 생성
export const createMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const validatedData = createMessageSchema.parse(req.body);

    const message = await chatService.createMessage({
      ...validatedData,
      authorId: userId
    });

    return res.status(201).json({
      success: true,
      data: { message },
      message: '메시지가 전송되었습니다.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        errors: error.errors
      });
    }

    logger.error('메시지 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 전송 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// 메시지 목록 조회
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { classroomId } = req.params;
    const { limit = '50', before } = req.query;

    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: '강의실 ID가 필요합니다.'
      });
    }

    const messages = await chatService.getMessages(
      classroomId,
      userId,
      parseInt(limit as string),
      before as string
    );

    return res.json({
      success: true,
      data: { messages },
      message: '메시지 목록을 조회했습니다.'
    });

  } catch (error) {
    logger.error('메시지 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// 메시지 수정
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { messageId } = req.params;
    const validatedData = updateMessageSchema.parse(req.body);

    const message = await chatService.updateMessage(messageId, userId, validatedData);

    return res.json({
      success: true,
      data: { message },
      message: '메시지가 수정되었습니다.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        errors: error.errors
      });
    }

    logger.error('메시지 수정 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 수정 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// 메시지 삭제
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { messageId } = req.params;

    await chatService.deleteMessage(messageId, userId);

    return res.json({
      success: true,
      message: '메시지가 삭제되었습니다.'
    });

  } catch (error) {
    logger.error('메시지 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 삭제 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// 메시지 읽음 처리
export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { messageId } = req.params;

    await chatService.markMessageAsRead(messageId, userId);

    return res.json({
      success: true,
      message: '메시지를 읽음으로 처리했습니다.'
    });

  } catch (error) {
    logger.error('메시지 읽음 처리 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 읽음 처리 중 오류가 발생했습니다.'
    });
  }
};

// 메시지 반응 토글
export const toggleMessageReaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { messageId } = req.params;
    const validatedData = messageReactionSchema.parse(req.body);

    const result = await chatService.toggleMessageReaction(
      messageId,
      userId,
      validatedData.emoji
    );

    return res.json({
      success: true,
      data: result,
      message: result.added ? '반응이 추가되었습니다.' : '반응이 제거되었습니다.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        errors: error.errors
      });
    }

    logger.error('메시지 반응 토글 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 반응 처리 중 오류가 발생했습니다.'
    });
  }
};

// 온라인 사용자 목록 조회
export const getOnlineUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { classroomId } = req.params;

    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: '강의실 ID가 필요합니다.'
      });
    }

    const onlineUsers = await chatService.getOnlineUsers(classroomId);

    return res.json({
      success: true,
      data: { onlineUsers },
      message: '온라인 사용자 목록을 조회했습니다.'
    });

  } catch (error) {
    logger.error('온라인 사용자 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '온라인 사용자 조회 중 오류가 발생했습니다.'
    });
  }
};

// 안읽은 메시지 수 조회
export const getUnreadMessageCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const { classroomId } = req.params;

    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: '강의실 ID가 필요합니다.'
      });
    }

    const unreadCount = await chatService.getUnreadMessageCount(classroomId, userId);

    return res.json({
      success: true,
      data: { unreadCount },
      message: '안읽은 메시지 수를 조회했습니다.'
    });

  } catch (error) {
    logger.error('안읽은 메시지 수 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '안읽은 메시지 수 조회 중 오류가 발생했습니다.'
    });
  }
};
