import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { CustomError } from '../utils/customError';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    err,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    userId: (req as any).user?.user_id,
    companyId: (req as any).user?.company_id,
  }, `Erreur: ${err.message}`);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
}; 