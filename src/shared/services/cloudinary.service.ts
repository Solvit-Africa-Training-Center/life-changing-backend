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
  useFilename?: boolean;   
  filenameOverride?: string;  
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
    folder: string = 'uploads',
    file: Express.Multer.File,
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
  * Upload a file with custom options
  */
  async uploadFileWithOptions(
    folder: string,
    file: Express.Multer.File,
    options: CloudinaryUploadOptions = {}
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        folder,
        resource_type: options.resourceType || 'auto',
        overwrite: options.overwrite ?? false,
        unique_filename: options.uniqueFilename ?? true, 
        use_filename: options.useFilename ?? false,      
        filename_override: options.filenameOverride,  
        public_id: options.publicId,      
        tags: options.tags,
        transformation: options.transformation,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
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

  // ================= PROGRAM & PROJECT METHODS =================

  // Add this method for program-specific uploads
  async uploadProgramCover(programId: string, file: Express.Multer.File): Promise<UploadResult> {
    const folder = `programs/${programId}/cover`;
    return this.uploadFile(folder, file);
  }

  async uploadProgramLogo(programId: string, file: Express.Multer.File): Promise<UploadResult> {
    const folder = `programs/${programId}/logo`;
    return this.uploadFile(folder, file);
  }

  async uploadProjectCover(programId: string, projectId: string, file: Express.Multer.File): Promise<UploadResult> {
    const folder = `programs/${programId}/projects/${projectId}/cover`;
    return this.uploadFile(folder, file);
  }

  async uploadProjectGallery(programId: string, projectId: string, file: Express.Multer.File): Promise<UploadResult> {
    const folder = `programs/${programId}/projects/${projectId}/gallery`;
    return this.uploadFile(folder, file);
  }

  async uploadProjectMedia(programId: string, projectId: string, file: Express.Multer.File): Promise<UploadResult> {
    const folder = `programs/${programId}/projects/${projectId}`;
    return this.uploadFile(folder, file);
  }


  // ================= STORY METHODS =================
async uploadStoryMedia(
  storyId: string,
  file: Express.Multer.File,
  mediaType: 'image' | 'video',
): Promise<UploadResult> {
  const folder = `stories/${storyId}/${mediaType}`;
  
  const options: CloudinaryUploadOptions = {
    resourceType: mediaType === 'video' ? 'video' : 'image',
    useFilename: true,
    uniqueFilename: true,
    filenameOverride: file.originalname,
  };

  // Generate thumbnail for videos
  if (mediaType === 'video') {
    options.transformation = [
      { width: 500, crop: 'scale' },
      { quality: 'auto' }
    ];
  }

  return this.uploadFileWithOptions(folder, file, options);
}

async uploadStoryThumbnail(
  storyId: string,
  file: Express.Multer.File,
): Promise<UploadResult> {
  const folder = `stories/${storyId}/thumbnail`;
  return this.uploadFile(folder, file);
}

async deleteStoryMedia(storyId: string): Promise<void> {
  const folder = `stories/${storyId}`;
  await this.deleteFolder(folder);
}


  // ================= DOCUMENT METHODS =================
  /**
   * Upload a document (supports PDF, DOC, DOCX, XLS, XLSX, images, etc.)
   */
  async uploadDocument(
    folder: string,
    file: Express.Multer.File,
    documentType?: string
  ): Promise<UploadResult> {
    // Determine resource type based on mime type
    let resourceType: 'image' | 'raw' | 'video' = 'raw';

    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    // For PDFs and office documents, use 'raw' resource type with specific options
    const options: CloudinaryUploadOptions = {
      resourceType,
      useFilename: true,
      uniqueFilename: true,
      filenameOverride: file.originalname,
    };

    // Add specific tags for document type
    if (documentType) {
      options.tags = ['beneficiary-document', documentType];
    }

    // For PDFs, add special transformation for preview
    if (file.mimetype === 'application/pdf') {
      options.transformation = [
        { pages: '1', width: 500, crop: 'scale' } // Generate thumbnail of first page
      ];
    }

    return this.uploadFileWithOptions(folder, file, options);
  }

  /**
   * Upload a base64 encoded document
   */
  async uploadBase64Document(
    base64String: string,
    folder: string,
    documentType?: string
  ): Promise<UploadResult> {
    // Extract mime type from base64 if present
    let resourceType: 'image' | 'raw' = 'raw';
    let mimeType = 'application/octet-stream';

    if (base64String.includes(';base64,')) {
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,/);
      if (matches && matches[1]) {
        mimeType = matches[1];
        if (mimeType.startsWith('image/')) {
          resourceType = 'image';
        }
      }
    }

    const options: CloudinaryUploadOptions = {
      folder,
      resourceType,
      uniqueFilename: true, 
    };

    if (documentType) {
      options.tags = ['beneficiary-document', documentType];
    }

    const result: UploadApiResponse = await cloudinary.uploader.upload(base64String, options);

    if (!result) {
      throw new Error('Upload failed: No result returned');
    }

    return this.mapUploadResult(result);
  }


  /**
   * Upload multiple documents in batch
   */
  async uploadMultipleDocuments(
    folder: string,
    files: Express.Multer.File[],
    documentType?: string
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file =>
      this.uploadDocument(folder, file, documentType)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Upload a document with custom public ID (for replacement/update)
   */
  async uploadDocumentWithPublicId(
    folder: string,
    file: Express.Multer.File,
    publicId: string,
    documentType?: string
  ): Promise<UploadResult> {
    const options: CloudinaryUploadOptions = {
      folder,
      publicId,
      resourceType: file.mimetype.startsWith('image/') ? 'image' : 'raw',
      overwrite: true,
      uniqueFilename: false,
      useFilename: true,
      filenameOverride: file.originalname,
    };

    if (documentType) {
      options.tags = ['beneficiary-document', documentType];
    }

    return this.uploadFileWithOptions(folder, file, options);
  }


  // ================= BENEFICIARY SPECIFIC METHODS =================

  /**
   * Upload a beneficiary ID document
   */
  async uploadBeneficiaryIdDocument(
    beneficiaryId: string,
    file: Express.Multer.File
  ): Promise<UploadResult> {
    const folder = `beneficiaries/${beneficiaryId}/documents/id`;
    return this.uploadDocument(folder, file, 'id_card');
  }

  /**
   * Upload a beneficiary supporting document
   */
  async uploadBeneficiarySupportingDocument(
    beneficiaryId: string,
    file: Express.Multer.File,
    subFolder: string = 'supporting'
  ): Promise<UploadResult> {
    const folder = `beneficiaries/${beneficiaryId}/documents/${subFolder}`;
    return this.uploadDocument(folder, file, 'supporting_document');
  }

  /**
   * Upload a beneficiary document with custom type
   */
  async uploadBeneficiaryDocument(
    beneficiaryId: string,
    file: Express.Multer.File,
    documentType: string
  ): Promise<UploadResult> {
    const folder = `beneficiaries/${beneficiaryId}/documents/${documentType}`;
    return this.uploadDocument(folder, file, documentType);
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
    if (publicIds.length === 0) return;
    await cloudinary.api.delete_resources(publicIds);
  }

  /**
   * Delete files by prefix/folder
   */
  async deleteFolder(folderPath: string): Promise<void> {
    try {
      const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
      // Also delete the folder itself
      await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
      // Handle case where folder doesn't exist
      console.log(`No files found in folder: ${folderPath}`);
    }
  }

  /**
   * Delete all beneficiary documents
   */
  async deleteAllBeneficiaryDocuments(beneficiaryId: string): Promise<void> {
    const folder = `beneficiaries/${beneficiaryId}/documents`;
    await this.deleteFolder(folder);
  }


  // ================= UTILITY METHODS =================

  /**
   * Get document URL with transformations (e.g., for PDF preview)
   */
  getDocumentPreviewUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    page?: number;
    format?: string;
  }): string {
    const { width = 500, height, page = 1, format = 'jpg' } = options || {};

    return cloudinary.url(publicId, {
      resource_type: 'raw',
      transformation: [
        { pages: page.toString() },
        { width, height, crop: 'scale' },
        { format }
      ]
    });
  }

  /**
   * Generate a secure URL for a document
   */
  getDocumentUrl(publicId: string, options?: {
    resourceType?: 'image' | 'raw' | 'video';
    format?: string;
    transformation?: any[];
  }): string {
    const { resourceType = 'raw', format, transformation } = options || {};

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      format,
      transformation,
      secure: true,
    });
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

  /**
  * Extract public ID from URL
  */
  extractPublicIdFromUrl(url: string): string | null {
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Check if a file is an image
   */
  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if a file is a PDF
   */
  isPdfFile(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  /**
   * Check if a file is a document (PDF, DOC, DOCX, etc.)
   */
  isDocumentFile(mimeType: string): boolean {
    const documentMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];
    return documentMimeTypes.includes(mimeType) || this.isImageFile(mimeType);
  }
}
