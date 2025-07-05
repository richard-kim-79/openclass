import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    subscription: string;
    isActive: boolean;
    isVerified: boolean;
  };
}

export class ApiKeyController {
  /**
   * API 키 발급
   */
  static async generateApiKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // 기존 API 키 확인
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { apiKey: true }
      });

      if (existingUser?.apiKey && existingUser.apiKey !== '') {
        return res.status(400).json({
          success: false,
          error: '이미 API 키가 발급되어 있습니다',
          code: 'API_KEY_EXISTS'
        });
      }

      // 새로운 API 키 생성
      const newApiKey = `ok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // API 키 업데이트
      await prisma.user.update({
        where: { id: userId },
        data: { apiKey: newApiKey }
      });

      logInfo('API 키 발급 완료', { userId });

      return res.json({
        success: true,
        message: 'API 키가 성공적으로 발급되었습니다',
        data: {
          apiKey: newApiKey,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logError('API 키 발급 오류:', error as Error);
      return res.status(500).json({
        success: false,
        error: 'API 키 발급 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * API 키 재발급
   */
  static async regenerateApiKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // 새로운 API 키 생성
      const newApiKey = `ok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // API 키 업데이트
      await prisma.user.update({
        where: { id: userId },
        data: { apiKey: newApiKey }
      });

      logInfo('API 키 재발급 완료', { userId });

      return res.json({
        success: true,
        message: 'API 키가 성공적으로 재발급되었습니다',
        data: {
          apiKey: newApiKey,
          regeneratedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logError('API 키 재발급 오류:', error as Error);
      return res.status(500).json({
        success: false,
        error: 'API 키 재발급 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * API 키 조회
   */
  static async getApiKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          apiKey: true, 
          subscription: true,
          createdAt: true 
        }
      });

      if (!user?.apiKey || user.apiKey === '') {
        return res.status(404).json({
          success: false,
          error: '발급된 API 키가 없습니다',
          code: 'API_KEY_NOT_FOUND'
        });
      }

      // API 사용 통계 조회
      const apiUsage = await ApiKeyController.getApiUsage(userId);

      return res.json({
        success: true,
        data: {
          apiKey: user.apiKey,
          subscription: user.subscription,
          createdAt: user.createdAt.toISOString(),
          usage: apiUsage
        }
      });

    } catch (error) {
      logError('API 키 조회 오류:', error as Error);
      return res.status(500).json({
        success: false,
        error: 'API 키 조회 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * API 키 삭제
   */
  static async deleteApiKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      await prisma.user.update({
        where: { id: userId },
        data: { apiKey: '' }
      });

      logInfo('API 키 삭제 완료', { userId });

      return res.json({
        success: true,
        message: 'API 키가 성공적으로 삭제되었습니다'
      });

    } catch (error) {
      logError('API 키 삭제 오류:', error as Error);
      return res.status(500).json({
        success: false,
        error: 'API 키 삭제 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * API 키로 인증
   */
  static async authenticateWithApiKey(req: Request, res: Response, next: Function) {
    try {
      const apiKey = req.header('X-API-Key') || req.query.apiKey as string;

      if (!apiKey) {
        res.status(401).json({
          success: false,
          error: 'API 키가 필요합니다',
          code: 'API_KEY_REQUIRED'
        });
        return;
      }

      // API 키로 사용자 조회
      const user = await prisma.user.findUnique({
        where: { apiKey },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscription: true,
          isActive: true,
          isVerified: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: '유효하지 않은 API 키입니다',
          code: 'INVALID_API_KEY'
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          error: '비활성화된 계정입니다',
          code: 'INACTIVE_ACCOUNT'
        });
        return;
      }

      // 요청 객체에 사용자 정보 추가
      (req as AuthRequest).user = user;

      // API 사용량 기록
      await ApiKeyController.recordApiUsage(user.id, req.path, req.method);

      next();
    } catch (error) {
      logError('API 키 인증 오류:', error as Error);
      res.status(500).json({
        success: false,
        error: 'API 키 인증 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * API 사용량 조회 (내부 메서드)
   */
  private static async getApiUsage(userId: string) {
    try {
      const usage = await prisma.apiUsage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayCalls = usage.filter(u => 
        new Date(u.createdAt) >= today
      ).length;

      const monthlyCalls = usage.filter(u => 
        new Date(u.createdAt) >= thisMonth
      ).length;

      const limit = ApiKeyController.getApiLimit(userId);

      return {
        totalCalls: usage.length,
        todayCalls,
        monthlyCalls,
        limit
      };
    } catch (error) {
      logError('API 사용량 조회 오류:', error as Error);
      return {
        totalCalls: 0,
        todayCalls: 0,
        monthlyCalls: 0,
        limit: 1000
      };
    }
  }

  /**
   * API 사용량 기록 (내부 메서드)
   */
  private static async recordApiUsage(userId: string, endpoint: string, method: string) {
    try {
      await prisma.apiUsage.create({
        data: {
          userId,
          apiKey: '', // 실제 API 키는 보안상 저장하지 않음
          endpoint,
          method,
          statusCode: 200,
          userAgent: '',
          ipAddress: ''
        }
      });
    } catch (error) {
      logError('API 사용량 기록 오류:', error as Error);
    }
  }

  /**
   * API 사용 제한 조회 (내부 메서드)
   */
  private static getApiLimit(userId: string): number {
    // 구독별 제한 설정
    const limits = {
      free: 1000,
      premium: 10000,
      enterprise: 100000
    };
    
    return limits.free; // 기본값
  }
} 