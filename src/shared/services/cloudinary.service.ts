// src/shared/services/cloudinary.service.ts
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

export interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicId?: string;
  tags?: string[];
  transformation?: any;
  overwrite?: boolean;
  uniqueFilename?: boolean;
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

  /**
   * Upload a file buffer to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
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
            reject(error);
          } else if (!result) {
            reject(new Error('Upload failed: No result returned'));
          } else {
            resolve(this.mapUploadResult(result));
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Upload a base64 string to Cloudinary
   */
  async uploadBase64File(
    base64String: string,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    const result: UploadApiResponse = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: 'auto',
      overwrite: false,
      unique_filename: true,
    });
    
    if (!result) {
      throw new Error('Upload failed: No result returned');
    }
    
    return this.mapUploadResult(result);
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  /**
   * Delete multiple files from Cloudinary
   */
  async deleteFiles(publicIds: string[]): Promise<void> {
    await cloudinary.api.delete_resources(publicIds);
  }

  /**
   * Helper method to map Cloudinary response to our interface
   */
  private mapUploadResult(result: UploadApiResponse): UploadResult {
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