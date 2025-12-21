import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';
import { successResponse, errorResponse } from '../../common/http/api-response.util';

@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return errorResponse('VALIDATION_ERROR', 'Aucune image fournie');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Format d\'image non supporté. Utilisez JPEG, PNG, GIF ou WebP.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return errorResponse(
        'VALIDATION_ERROR',
        'L\'image est trop volumineuse. Taille maximum: 5MB.',
      );
    }

    const imageUrl = await this.uploadService.uploadImage(file);
    return successResponse({ imageUrl });
  }
}
