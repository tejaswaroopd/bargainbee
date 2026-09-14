import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]', err);

  if (err.name === 'AppError') {
    const appErr = err as AppError;
    res.status(appErr.statusCode).json({ error: appErr.message });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(422).json({ error: err.message });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(409).json({ error: 'Database constraint or record conflict' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
