// src/modules/content/content.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Story } from './entities/story.entity';
import { Program } from '../programs/entities/program.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';

// Controllers
import { StoriesController } from './controllers/stories.controller';

// Services
import { StoriesService } from './services/stories.service';
import { StoryValidationService } from './services/story-validation.service';
import { StoryCreationService } from './services/story-creation.service';
import { StoryUpdateService } from './services/story-update.service';
import { StoryMediaService } from './services/story-media.service';
import { StoryQueryService } from './services/story-query.service';
import { StoryDeletionService } from './services/story-deletion.service';
import { StoryStatsService } from './services/story-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, Program, Beneficiary]),
  ],
  controllers: [StoriesController],
  providers: [
    StoriesService,
    StoryValidationService,
    StoryCreationService,
    StoryUpdateService,
    StoryMediaService,
    StoryQueryService,
    StoryDeletionService,
    StoryStatsService,
  ],
  exports: [StoriesService],
})
export class ContentModule {}