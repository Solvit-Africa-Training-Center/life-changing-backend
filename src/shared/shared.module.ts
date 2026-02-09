// src/shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { Helpers } from './utils/helpers';

@Global() // Makes services available globally
@Module({
  providers: [CloudinaryService, Helpers],
  exports: [CloudinaryService, Helpers],
})
export class SharedModule {}
