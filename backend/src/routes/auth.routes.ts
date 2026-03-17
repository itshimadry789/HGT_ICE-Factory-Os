import { Router, Request, Response } from 'express';
import { getSupabaseAnonClient } from '../config/supabase';
import { ApiResponse } from '../types';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required',
        code: 'TOKEN_REQUIRED',
      });
      return;
    }

    const supabase = getSupabaseAnonClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    const response: ApiResponse<{ valid: boolean; user: { id: string; email: string } }> = {
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          email: user.email || '',
        },
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;

