import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { API_PREFIX } from './config/constants';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global middleware
  app.use(helmet());
  app.use(compression());
  app.use(new LoggingMiddleware().use);

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('config.frontendUrl'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix(API_PREFIX);

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: false, // ✅ REQUIRED for multipart + nested DTOs
      forbidNonWhitelisted: false, // ✅ REQUIRED
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

    // Enable class-transformer serialization
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger documentation
  if (configService.get('config.features.enableSwagger')) {
    const config = new DocumentBuilder()
      .setTitle('LCEO API')
      .setDescription('Life-Changing Endeavor Organization API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('beneficiaries', 'Beneficiary management')
      .addTag('staff', 'Staff dashboard')
      .addTag('donors', 'Donor dashboard')
      .addTag('donations', 'Donation processing')
      .addTag('programs', 'Program management')
      .addTag('ussd', 'USSD integration')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('config.port');
  await app.listen(port);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  if (configService.get('config.features.enableSwagger')) {
    console.log(`📚 API Documentation: ${await app.getUrl()}/api/docs`);
  }
}

bootstrap();
