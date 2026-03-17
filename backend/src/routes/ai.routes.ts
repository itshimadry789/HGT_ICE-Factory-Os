import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AiController();

router.post(
  '/chat',
  authenticate,
  (req, res, next) => controller.handleChat(req, res).catch(next)
);

export default router;
