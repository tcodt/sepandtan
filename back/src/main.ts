import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma.filters.js';
import { ValidationPipe } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with specific origins in production
  const isProduction = process.env.NODE_ENV === 'production';

  // if (isProduction) {
  const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(',').filter(Boolean);
  app.use(cookieParser());
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-xsrf-token'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
  // }

  app.useGlobalFilters(new PrismaExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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
      .setContact('Reza & Amir', 'https://github.com', 'r.dkhani1385.66@gmail.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .build();

    const document = SwaggerModule.createDocument(app, documentConfig);
    writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        docExpansion: 'none',
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