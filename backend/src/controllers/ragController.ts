import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../utils/logger';

const prisma = new PrismaClient();

export class RAGController {
  /**
   * RAG 쿼리 처리
   */
  static async query(req: Request, res: Response) {
    try {
      const { query, limit = 5 } = req.body;
      const apiKey = req.header('X-API-Key') || req.query.apiKey as string;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API 키가 필요합니다',
          code: 'API_KEY_REQUIRED'
        });
      }

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: '쿼리가 필요합니다',
          code: 'QUERY_REQUIRED'
        });
      }

      // API 키로 사용자 확인
      const user = await prisma.user.findUnique({
        where: { apiKey },
        select: { id: true, subscription: true }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: '유효하지 않은 API 키입니다',
          code: 'INVALID_API_KEY'
        });
      }

      // 간단한 검색 (실제로는 벡터 검색을 사용해야 함)
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } }
          ]
        },
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      const sources = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content || '',
        type: 'POST' as const,
        author: {
          id: post.author.id,
          name: post.author.name,
          avatarUrl: post.author.avatarUrl || undefined
        },
        tags: post.tags ? JSON.parse(post.tags) : [],
        relevanceScore: 0.8,
        url: `/posts/${post.id}`,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      }));

      // 간단한 답변 생성
      const answer = `질문: ${query}\n\n찾은 정보를 바탕으로 답변드리겠습니다:\n\n${sources.map(s => s.content).join('\n\n')}\n\n이 정보들이 도움이 되었기를 바랍니다.`;

      const response = {
        answer,
        sources,
        confidence: 0.8
      };

      logInfo('RAG 쿼리 처리 완료', { 
        userId: user.id, 
        query, 
        resultCount: sources.length 
      });

      return res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logError('RAG 쿼리 처리 오류:', error as Error);
      return res.status(500).json({
        success: false,
        error: 'RAG 쿼리 처리 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 벡터 검색
   */
  static async search(req: Request, res: Response) {
    try {
      const { q: query, limit = 10 } = req.query;
      const apiKey = req.header('X-API-Key') || req.query.apiKey as string;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API 키가 필요합니다',
          code: 'API_KEY_REQUIRED'
        });
      }

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: '검색 쿼리가 필요합니다',
          code: 'QUERY_REQUIRED'
        });
      }

      // API 키로 사용자 확인
      const user = await prisma.user.findUnique({
        where: { apiKey },
        select: { id: true }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: '유효하지 않은 API 키입니다',
          code: 'INVALID_API_KEY'
        });
      }

      // 간단한 검색
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } }
          ]
        },
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      const results = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content || '',
        type: 'POST' as const,
        author: {
          id: post.author.id,
          name: post.author.name,
          avatarUrl: post.author.avatarUrl || undefined
        },
        tags: post.tags ? JSON.parse(post.tags) : [],
        relevanceScore: 0.8,
        url: `/posts/${post.id}`,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      }));

      logInfo('벡터 검색 완료', { 
        userId: user.id, 
        query, 
        resultCount: results.length 
      });

      return res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logError('벡터 검색 오류:', error as Error);
      return res.status(500).json({
        success: false,
        error: '벡터 검색 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR'
      });
    }
  }
} 