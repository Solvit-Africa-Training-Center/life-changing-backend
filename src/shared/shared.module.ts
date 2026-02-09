import { Module, Global } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';

@Global() // 👈 makes it available everywhere
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class SharedModule {}
