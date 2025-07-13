import { Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import * as toStream from 'buffer-to-stream';
import { cloudinary } from 'src/config/cloudinary';

@Injectable()
export class FileUploadRepository {
  async uploadImg(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            reject(new Error(error.message || 'Cloudinary upload failed'));
          } else {
            resolve(result!);
          }
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }
}
