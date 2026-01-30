import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './app.module';
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { AuthModule } from './modules/auth/auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Simplified middleware for debugging
  app.enableCors();

  // Global prefix - changed from /api/v1 to /api to avoid double /v1/v1
  app.setGlobalPrefix('api');

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

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
      .addTag('beneficiaries', 'Beneficiary management')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      include: [BeneficiariesModule, AuthModule],
    });

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
      },
      customSiteTitle: 'LCEO API Docs',
    });
  }

  const port = 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();