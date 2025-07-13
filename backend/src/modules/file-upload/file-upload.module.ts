import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { FileUploadRepository } from './file-upload.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entity/file-upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [FileUploadController],
  providers: [FileUploadService, FileUploadRepository],
  exports: [FileUploadService],
})
export class FileUploadModule {}
