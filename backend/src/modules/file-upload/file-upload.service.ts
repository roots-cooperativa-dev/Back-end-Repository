import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUploadRepository } from './file-upload.repository';
import { File } from './entity/file-upload.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly fileUploadRepository: FileUploadRepository,
  ) {}

  async uploadImg(file: Express.Multer.File) {
    const uploadResponse = await this.fileUploadRepository.uploadImg(file);

    const newfile = this.fileRepository.create({
      url: uploadResponse.secure_url,
      mimeType: file.mimetype,
    });

    return await this.fileRepository.save(newfile);
  }
}
