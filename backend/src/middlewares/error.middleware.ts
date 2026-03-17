import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const errorResponse: ApiError = {
      success: false,
      message: err.message,
      code: err.code,
    };

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  console.error('Unhandled error:', err);

  const errorResponse: ApiError = {
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  };

  res.status(500).json(errorResponse);
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
}

