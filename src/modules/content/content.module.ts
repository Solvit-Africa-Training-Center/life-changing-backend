import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Story } from './entities/story.entity';
import { SharedModule } from 'src/shared/services/shared.module';
import { ContentMediaCleanupJob } from './jobs/content-media-cleanup.job';


@Module({
  imports: [
    TypeOrmModule.forFeature([Story]), 
    SharedModule,
  ],
  controllers: [ContentController],
  providers: [
    
    ContentService,
    ContentMediaCleanupJob,
  ],

})
export class ContentModule {}