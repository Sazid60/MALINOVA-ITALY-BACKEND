import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;           // secure HTTPS URL
  public_id: string;     // cloudinary public_id (for deletion)
  width: number;
  height: number;
  format: string;
  bytes: number;
  folder: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly folder: string;

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key:    config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
    this.folder = config.get<string>('CLOUDINARY_FOLDER', 'achar-shop');
  }

  /**
   * Upload a single file buffer to Cloudinary.
   * @param file       Multer file object (buffer in memory)
   * @param subfolder  e.g. 'products', 'blogs', 'hero'
   * @param publicId   Optional custom public_id (without extension)
   */
  async uploadFile(
    file: Express.Multer.File,
    subfolder = 'products',
    publicId?: string,
  ): Promise<UploadResult> {
    this.validateFile(file);

    const folder = `${this.folder}/${subfolder}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          // Auto-detect format, convert to webp for smaller size
          format: 'webp',
          // Auto-optimize quality
          quality: 'auto',
          // Limit max dimensions
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { fetch_format: 'auto', quality: 'auto' },
          ],
          // Overwrite if same public_id
          overwrite: true,
          // Add tags for easy management in Cloudinary dashboard
          tags: ['achar-shop', subfolder],
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            reject(new BadRequestException(`Image upload failed: ${error.message}`));
          } else {
            resolve({
              url:       result.secure_url,
              public_id: result.public_id,
              width:     result.width,
              height:    result.height,
              format:    result.format,
              bytes:     result.bytes,
              folder:    result.folder,
            });
          }
        },
      );

      // Pipe buffer into the stream
      // const readable = Readable.from(file.buffer);
      const readable = Readable.from(Buffer.from(file.buffer))
      readable.pipe(uploadStream);
    });
  }

  /**
   * Upload multiple files at once.
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    subfolder = 'products',
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.uploadFile(f, subfolder)));
  }

  /**
   * Delete an image from Cloudinary by public_id.
   */
  async deleteFile(publicId: string): Promise<{ result: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted Cloudinary asset: ${publicId} → ${result.result}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to delete ${publicId}: ${errorMessage}`);
      throw new BadRequestException(`Failed to delete image: ${errorMessage}`);
    }
  }

  /**
   * Delete multiple images at once.
   */
  async deleteMultiple(publicIds: string[]): Promise<void> {
    if (!publicIds.length) return;
    await cloudinary.api.delete_resources(publicIds);
    this.logger.log(`Deleted ${publicIds.length} Cloudinary assets`);
  }

  /**
   * Generate a transformation URL (resize on-the-fly).
   */
  getTransformedUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string; quality?: string } = {},
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      width:   options.width   ?? 600,
      height:  options.height  ?? 600,
      crop:    options.crop    ?? 'fill',
      quality: options.quality ?? 'auto',
      fetch_format: 'auto',
    });
  }

  // ── Validation ────────────────────────────────────────────
  private validateFile(file: Express.Multer.File): void {
    const ALLOWED_MIME_TYPES = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'image/avif', 'image/svg+xml', 'image/tiff', 'image/bmp',
      'image/heic', 'image/heif', 'image/x-icon', 'image/vnd.microsoft.icon',
    ];
    const MAX_FILE_SIZE_MB = 5;

    if (!file) throw new BadRequestException('No file provided');

    // memoryStorage() না থাকলে buffer আসে না — disk storage ব্যবহার হচ্ছে কিনা ধরে ফেলা
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        'File buffer is empty. Ensure multer memoryStorage() is configured.',
      );
    }


    // if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    //   throw new BadRequestException(
    //     `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF`,
    //   );
    // }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, AVIF, SVG, TIFF, BMP, HEIC, ICO`,
      );
    }


    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: ${MAX_FILE_SIZE_MB}MB`,
      );
    }
  }
}
