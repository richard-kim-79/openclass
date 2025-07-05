import { Router } from 'express';
import { RAGController } from '../controllers/ragController';
import { ApiKeyController } from '../controllers/apiKeyController';

const router = Router();

// API 키 인증 미들웨어 적용
router.use(ApiKeyController.authenticateWithApiKey);

// RAG 쿼리
router.post('/query', RAGController.query);

// 벡터 검색
router.get('/search', RAGController.search);

export default router; 