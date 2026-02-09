import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
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
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow large file uploads (images & videos)
  app.use(bodyParser.json({ limit: '120mb' }));
  app.use(bodyParser.urlencoded({ limit: '120mb', extended: true }));

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

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
  app.setGlobalPrefix(
  configService.getOrThrow<string>('config.apiPrefix'),
);


  // Versioning
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

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
      .addTag('donations', 'Donation processing')
      .addTag('programs', 'Program management')
      .addTag('ussd', 'USSD integration')
      .addTag('admin', 'Admin dashboard')
      // .addTag('content', 'Content management')
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