import { Module, Global } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';

/**
 * Global module — CloudinaryService injectable everywhere
 * without re-importing UploadModule in each feature module.
 */
@Global()
@Module({
  controllers: [UploadController],
  providers:   [CloudinaryService],
  exports:     [CloudinaryService],
})
export class UploadModule {}
