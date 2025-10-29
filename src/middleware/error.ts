import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error for debugging purposes
  console.error('💥 ERROR 💥', err);

  if (err instanceof AppError) {
    // Handle operational, trusted errors: send message to client
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Handle programming or other unknown errors: don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};