import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../types/api-response';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse) {
        const resp = exceptionResponse as Record<string, unknown>;
        message =
          (typeof resp.message === 'string' ? resp.message : undefined) ||
          exception.message;
        errors = resp.errors;
      }

      // Personnaliser les messages d'erreur 401
      if (status === HttpStatus.UNAUTHORIZED && message === 'Unauthorized') {
        message = 'Authentification requise, veuillez vous connecter';
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Erreurs Prisma connues
      status = HttpStatus.BAD_REQUEST;
      if (exception.code === 'P2002') {
        message = 'Cette valeur est déjà utilisée';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Ressource introuvable';
      } else {
        message = 'Erreur de base de données';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    // Format ApiResponse pour les erreurs
    console.log('GlobalExceptionFilter caught an exception:', {
      status,
      message,
      errors,
    });
    const responseBody = ApiResponse.error(message, errors);

    response.status(status).json(responseBody);
  }
}
