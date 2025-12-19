import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiException } from '../exceptions/api.exception';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    // 1️⃣ Erreur métier connue
    if (exception instanceof ApiException) {
      console.log('API Exception:', exception);
      return response.status(exception.status).json({
        success: false,
        data: null,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      });
    }

    // 2️⃣ HttpException NestJS (fallback)
    if (exception instanceof HttpException) {
      console.error('HTTP Exception:', exception);
      return response.status(exception.getStatus()).json({
        success: false,
        data: null,
        error: {
          code: exception.getStatus().toString(),
          message: exception.message,
        },
      });
    }

    // 3️⃣ Prisma (converti en ApiException)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const apiException = mapPrismaError(exception);
      return response.status(apiException.status).json({
        success: false,
        data: null,
        error: {
          code: apiException.code,
          message: apiException.message,
        },
      });
    }

    console.error('Unknown Exception:', exception);
    // 4️⃣ Inconnu = 500
    return response.status(500).json({
      success: false,
      data: null,
      error: {
        code: HttpStatus.INTERNAL_SERVER_ERROR.toString(),
        message: 'Internal server error',
      },
    });
  }
}

function mapPrismaError(
  exception: Prisma.PrismaClientKnownRequestError,
): ApiException {
  switch (exception.code) {
    case 'P2002':
      return new ApiException(
        HttpStatus.BAD_REQUEST,
        'UNIQUE_CONSTRAINT',
        'Cette valeur est déjà utilisée',
      );

    case 'P2025':
      return new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Ressource introuvable',
      );

    default:
      return new ApiException(
        HttpStatus.BAD_REQUEST,
        'DATABASE_ERROR',
        'Erreur de base de données',
      );
  }
}
