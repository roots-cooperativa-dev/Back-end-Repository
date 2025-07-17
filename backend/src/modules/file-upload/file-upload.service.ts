import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUploadRepository } from './file-upload.repository';
import { File } from './entity/file-upload.entity';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly fileUploadRepository: FileUploadRepository,
  ) {}

  async uploadImg(file: Express.Multer.File, name: string) {
    const uploadResponse = await this.fileUploadRepository.uploadImg(file);

    const newfile = this.fileRepository.create({
      name: name,
      url: uploadResponse.secure_url,
      mimeType: file.mimetype,
    });

    return await this.fileRepository.save(newfile);
  }

  async getAllFiles(
    pageNum: number,
    limitNum: number,
  ): Promise<{ data: File[]; total: number }> {
    try {
      const skip = (pageNum - 1) * limitNum;

      const [data, total] = await this.fileRepository.findAndCount({
        skip,
        take: limitNum,
        order: { name: 'DESC' },
      });

      return { data, total };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error retrieving files');
    }
  }
}
