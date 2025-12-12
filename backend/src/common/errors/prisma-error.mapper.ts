import { ApiException } from '../exceptions/api.exception';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function mapPrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): ApiException {
  switch (error.code) {
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
