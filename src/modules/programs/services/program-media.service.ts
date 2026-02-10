// src/modules/programs/services/program-media.service.ts
import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';

@Injectable()
export class ProgramMediaService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadCoverImage(programId: string, coverImage: Express.Multer.File): Promise<{
    url: string;
    publicId: string;
  }> {
    return await this.cloudinaryService.uploadProgramCover(programId, coverImage);
  }

  async uploadLogo(programId: string, logo: Express.Multer.File): Promise<{
    url: string;
    publicId: string;
  }> {
    return await this.cloudinaryService.uploadProgramLogo(programId, logo);
  }

  async deleteImage(publicId: string): Promise<void> {
    if (publicId) {
      await this.cloudinaryService.deleteFile(publicId);
    }
  }

  async deleteImages(coverImagePublicId?: string, logoPublicId?: string): Promise<void> {
    const deletePromises:  Promise<void>[] = [];
    
    if (coverImagePublicId) {
      deletePromises.push(this.deleteImage(coverImagePublicId));
    }
    
    if (logoPublicId) {
      deletePromises.push(this.deleteImage(logoPublicId));
    }
    
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  }
}