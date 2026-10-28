import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma.filters.js';
import { ValidationPipe } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module.js';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS with specific origins in production
  const isProduction = process.env.NODE_ENV === 'production';

  // if (isProduction) {
  const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(',').filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-xsrf-token'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // }

  app.use(cookieParser());

  app.useGlobalFilters(new PrismaExceptionFilter());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV === 'development') {
    const documentConfig = new DocumentBuilder()
      .setTitle('Marketino API')
      .setDescription('Marketino Website API ')
      .setVersion('1.0')
      .addServer('http://localhost:3000', 'Local Server')
      .addServer('https://domaintest.com', 'Test Server...')
      .addBearerAuth()
      .addCookieAuth('token')
      .setContact('Amir & Reza', 'https://sepandtan.vercel.app/', '')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .build();

    const document = SwaggerModule.createDocument(app, documentConfig);
    writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        docExpansion: 'none',
        defaultModelsExpandDepth: -1,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
          activated: true,
          theme: 'obsidian',
        },
      },
    });
    console.log('Address Swagger ----> http://localhost:3000/api/');
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();