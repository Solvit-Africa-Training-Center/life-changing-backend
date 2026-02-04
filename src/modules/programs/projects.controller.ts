import { Controller, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { CloudinaryService } from '../../shared/services/cloudinary.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // ⭐ Upload project media
  @Post(':programId/:projectId/media')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProjectMedia(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    // eslint-disable-next-line no-undef
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cloudinaryService.uploadProjectMedia(programId, projectId, file);
  }
}
