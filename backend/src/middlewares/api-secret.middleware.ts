import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Middleware to validate API secret header for internal API access
 * Checks for x-api-secret header and compares it to INTERNAL_API_SECRET
 */
export function validateApiSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiSecret = req.headers['x-api-secret'] as string;

  if (!apiSecret) {
    res.status(401).json({
      success: false,
      message: 'API secret required',
      code: 'API_SECRET_REQUIRED',
    });
    return;
  }

  if (apiSecret !== config.internalApiSecret) {
    res.status(403).json({
      success: false,
      message: 'Invalid API secret',
      code: 'INVALID_API_SECRET',
    });
    return;
  }

  next();
}
