import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'quiz-images',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto:good' },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      throw new ApiException(
        500,
        ErrorCode.INTERNAL_ERROR,
        'Erreur lors de l\'upload de l\'image',
      );
    }
  }
}
