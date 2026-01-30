import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
    provide: CLOUDINARY,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        return cloudinary.config({
            cloud_name: configService.get<string>('config.cloudinary.cloudName'),
            api_key: configService.get<string>('config.cloudinary.apiKey'),
            api_secret: configService.get<string>('config.cloudinary.apiSecret'),
        });
    },
};
