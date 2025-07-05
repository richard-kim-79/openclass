import { Request, Response } from 'express';
import { aiSearchService } from '../services/aiSearchService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// 간소화된 스키마들
const searchRequestSchema = z.object({
  query: z.string().min(1, '검색어를 입력해주세요.').max(200, '검색어가 너무 깁니다.'),
  type: z.enum(['FILE', 'POST', 'COURSE', 'ALL']).optional().default('ALL'),
  limit: z.number().min(1).max(50).optional().default(10),
  includeAISummary: z.boolean().optional().default(false)
});

const suggestionsRequestSchema = z.object({
  query: z.string().min(1).max(100)
});

const autoTagsRequestSchema = z.object({
  content: z.string().min(10, '콘텐츠가 너무 짧습니다.').max(5000, '콘텐츠가 너무 깁니다.')
});

// AI 검색 수행
export const search = async (req: Request, res: Response) => {
  try {
    // 요청 데이터 검증
    const validatedData = searchRequestSchema.parse(req.body);
    
    // 사용자 ID 가져오기 (인증된 경우)
    const userId = (req as any).user?.id;
    
    // AI 검색 수행
    const results = await aiSearchService.search({
      query: validatedData.query,
      type: validatedData.type,
      limit: validatedData.limit,
      includeAISummary: validatedData.includeAISummary,
      userId
    });

    // 검색 로그 기록
    logger.info(`AI 검색 완료`, {
      userId,
      query: validatedData.query,
      resultCount: results.length,
      type: validatedData.type
    });

    return res.json({
      success: true,
      data: {
        query: validatedData.query,
        results,
        total: results.length,
        searchTime: new Date().toISOString()
      },
      message: '검색이 완료되었습니다.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        errors: error.errors
      });
    }

    logger.error('AI 검색 오류:', error);
    return res.status(500).json({
      success: false,
      message: 'AI 검색 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// 검색 제안 생성
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { query } = suggestionsRequestSchema.parse(req.query);
    
    const suggestions = await aiSearchService.generateSearchSuggestions(query);

    return res.json({
      success: true,
      data: {
        query,
        suggestions
      },
      message: '검색 제안이 생성되었습니다.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        errors: error.errors
      });
    }

    logger.error('검색 제안 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '검색 제안 생성 중 오류가 발생했습니다.'
    });
  }
};

// 자동 태그 생성
export const generateAutoTags = async (req: Request, res: Response) => {
  try {
    const { content } = autoTagsRequestSchema.parse(req.body);
    
    const tags = await aiSearchService.generateAutoTags(content);

    return res.json({
      success: true,
      data: {
        tags
      },
      message: '자동 태그가 생성되었습니다.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        errors: error.errors
      });
    }

    logger.error('자동 태그 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '자동 태그 생성 중 오류가 발생했습니다.'
    });
  }
};

// 인기 검색어 조회
export const getPopularSearches = async (req: Request, res: Response) => {
  try {
    // 샘플 인기 검색어
    const popularSearches = [
      'JavaScript 기초',
      'Python 데이터 분석',
      'React 컴포넌트',
      '머신러닝 입문',
      '웹 개발',
      '프로그래밍 패턴',
      '데이터베이스 설계',
      'API 개발'
    ];

    return res.json({
      success: true,
      data: {
        popularSearches
      },
      message: '인기 검색어 조회가 완료되었습니다.'
    });

  } catch (error) {
    logger.error('인기 검색어 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '인기 검색어 조회 중 오류가 발생했습니다.'
    });
  }
};

// 검색 통계 조회 (관리자용)
export const getSearchStats = async (req: Request, res: Response) => {
  try {
    // 관리자 권한 확인
    if ((req as any).user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 접근할 수 있습니다.'
      });
    }

    // 샘플 통계 데이터
    const stats = {
      totalSearches: 1247,
      avgResponseTime: 1.2,
      topQueries: [
        { query: 'JavaScript', count: 89 },
        { query: 'Python', count: 76 },
        { query: '웹개발', count: 64 }
      ],
      searchesByDay: [
        { date: '2025-07-01', count: 45 },
        { date: '2025-07-02', count: 52 },
        { date: '2025-07-03', count: 38 },
        { date: '2025-07-04', count: 42 }
      ]
    };

    return res.json({
      success: true,
      data: stats,
      message: '검색 통계 조회가 완료되었습니다.'
    });

  } catch (error) {
    logger.error('검색 통계 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '검색 통계 조회 중 오류가 발생했습니다.'
    });
  }
};
