import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';

@Injectable()
export class ContentMediaCleanupJob {
  private readonly logger = new Logger(ContentMediaCleanupJob.name);

  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // 

  @Cron('0 2 * * 0') // Every Sunday at 2 AM
  async handleCleanup() {
    this.logger.log('Starting content media cleanup job');

    const stories = await this.storyRepository.find({
      where: { isPublished: true },
    });

    const now = new Date();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    for (const story of stories) {
      if (!story.media || story.media.length === 0) continue;

      
      const remainingMedia: Story['media'] = [];

      for (const media of story.media) {
        if (!media.isDeleted || !media.deletedAt) {
          remainingMedia.push(media);
          continue;
        }

        const deletedAt = new Date(media.deletedAt);
        const age = now.getTime() - deletedAt.getTime();

        if (age > THIRTY_DAYS_MS) {

          // Permanent delete from Cloudinary
          await this.cloudinaryService.deleteFile(media.publicId);

          this.logger.log(
            `Deleted media ${media.publicId} from Cloudinary`,
          );
        } else {
          // Still within 30-day recovery window
          remainingMedia.push(media);
        }
      }

      story.media = remainingMedia;
      await this.storyRepository.save(story);
    }

    this.logger.log('Content media cleanup job finished');
  }
}
