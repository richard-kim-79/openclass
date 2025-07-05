import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Upload endpoint ready'
  });
});

export default router;
