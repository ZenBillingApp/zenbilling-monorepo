import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.user_id || 'non-authentifié';
    const companyId = (req as any).user?.company_id || 'non-authentifié';

    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId,
      companyId,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }, `${req.method} ${req.originalUrl}`);
  });

  next();
}; 