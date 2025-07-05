import { Router } from 'express';

const router = Router();

// 헬스체크 엔드포인트
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 루트 엔드포인트
router.get('/', (req, res) => {
  res.json({
    message: 'OpenClass API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

export default router; 