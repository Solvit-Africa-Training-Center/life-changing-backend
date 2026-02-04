import { Injectable } from '@nestjs/common';
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
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          overwrite: false,
          unique_filename: true,
        } as UploadApiOptions,
        (error, result: UploadApiResponse) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No upload result'));
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
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'auto',
      overwrite: false,
      unique_filename: true,
    });

    if (!result) throw new Error('No upload result');
    return this.mapResult(result);
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteFiles(publicIds: string[]): Promise<void> {
    await cloudinary.api.delete_resources(publicIds);
  }

  // =====================================================
  // PROGRAM MODULE HELPERS (THIS IS WHAT YOU ASKED FOR)
  // =====================================================

  /**
   * Upload program cover image
   * Folder: programs/{programId}
   */
  // eslint-disable-next-line no-undef
  async uploadProgramCover(programId: string, file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, `programs/${programId}/cover`);
  }

  /**
   * Upload program logo
   * Folder: programs/{programId}/logo
   */
  // eslint-disable-next-line no-undef
  async uploadProgramLogo(programId: string, file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, `programs/${programId}/logo`);
  }

  /**
   * Upload project media under a program
   * Folder: programs/{programId}/projects/{projectId}
   */
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
