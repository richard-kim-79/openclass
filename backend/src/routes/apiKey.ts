import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKeyController';
import { auth } from '../middleware/auth';

const router = Router();

// API 키 발급 (인증 필요)
router.post('/generate', auth, ApiKeyController.generateApiKey);

// API 키 조회 (인증 필요)
router.get('/me', auth, ApiKeyController.getApiKey);

// API 키 재발급 (인증 필요)
router.post('/regenerate', auth, ApiKeyController.regenerateApiKey);

// API 키 삭제 (인증 필요)
router.delete('/me', auth, ApiKeyController.deleteApiKey);

export default router; 