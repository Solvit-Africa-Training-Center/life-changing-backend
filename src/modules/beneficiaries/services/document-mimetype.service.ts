// src/modules/beneficiaries/services/document-mimetype.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentMimeTypeService {
  private readonly mimeTypeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
  };

  getMimeTypeFromFormat(format: string): string {
    return this.mimeTypeMap[format.toLowerCase()] || 'application/octet-stream';
  }

  getAllowedMimeTypes(documentType: string): string[] {
    // Different document types may have different allowed formats
    const documentTypeLower = documentType.toLowerCase();

    if (documentTypeLower.includes('image') || documentTypeLower.includes('photo') || documentTypeLower.includes('id')) {
      return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    }

    if (documentTypeLower.includes('certificate') || documentTypeLower.includes('letter')) {
      return ['application/pdf', 'image/jpeg', 'image/png'];
    }

    // Default allowed types
    return [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
  }

  isAllowedMimeType(mimeType: string, documentType: string): boolean {
    const allowedTypes = this.getAllowedMimeTypes(documentType);
    return allowedTypes.includes(mimeType);
  }

  getFileExtensionFromMimeType(mimeType: string): string {
    const entry = Object.entries(this.mimeTypeMap).find(([_, value]) => value === mimeType);
    return entry ? entry[0] : 'bin';
  }
}