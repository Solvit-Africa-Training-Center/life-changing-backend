import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
  createdAt: Date;
}

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // =====================================================
  // GENERIC UPLOADS (used by all modules)
  // =====================================================

  // eslint-disable-next-line no-undef
  async uploadFile(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          overwrite: false,
          unique_filename: true,
        } as UploadApiOptions,
        (error, result: UploadApiResponse) => {
          if (error) {
            return reject(
              new InternalServerErrorException(error.message || 'Cloudinary upload failed'),
            );
          }

          if (!result) {
            return reject(new InternalServerErrorException('No upload result from Cloudinary'));
          }

          resolve(this.mapResult(result));
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  async uploadBase64(base64: string, folder: string): Promise<UploadResult> {
    if (!base64) {
      throw new BadRequestException('No base64 data provided');
    }

    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'auto',
      overwrite: false,
      unique_filename: true,
    });

    if (!result) {
      throw new InternalServerErrorException('No upload result from Cloudinary');
    }

    return this.mapResult(result);
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!publicId) {
      throw new BadRequestException('Public ID is required');
    }

    await cloudinary.uploader.destroy(publicId);
  }

  async deleteFiles(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      throw new BadRequestException('Public IDs are required');
    }

    await cloudinary.api.delete_resources(publicIds);
  }

  // =====================================================
  // PROGRAM MODULE HELPERS
  // =====================================================

  // eslint-disable-next-line no-undef
  async uploadProgramCover(programId: string, file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, `programs/${programId}/cover`);
  }

  // eslint-disable-next-line no-undef
  async uploadProgramLogo(programId: string, file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, `programs/${programId}/logo`);
  }

  async uploadProjectMedia(
    programId: string,
    projectId: string,
    // eslint-disable-next-line no-undef
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    return this.uploadFile(file, `programs/${programId}/projects/${projectId}`);
  }

  // =====================================================
  // INTERNAL MAPPER
  // =====================================================

  private mapResult(result: UploadApiResponse): UploadResult {
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      createdAt: new Date(result.created_at),
    };
  }
}
