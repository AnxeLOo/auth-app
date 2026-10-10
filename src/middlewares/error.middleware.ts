import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erros operacionais customizados da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
    return;
  }

  // Erros de parsing de JSON no corpo da requisição
  if ('type' in err && (err as any).type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: {
        message: 'JSON malformado no corpo da requisição',
        code: 'BAD_REQUEST',
      },
    });
    return;
  }

  // Erros inesperados / internos
  console.error('💥 Erro não tratado:', err);

  const isProduction = env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      message: isProduction ? 'Ocorreu um erro interno no servidor' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
