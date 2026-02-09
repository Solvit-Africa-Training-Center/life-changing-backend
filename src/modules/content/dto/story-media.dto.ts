import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class StoryMediaDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(['image', 'video'])
  type: 'image' | 'video';

  @IsString()
  @IsNotEmpty()
  thumbnail: string;
}
