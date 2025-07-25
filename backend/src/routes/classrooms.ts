import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Classrooms endpoint ready',
    data: []
  });
});

export default router;
