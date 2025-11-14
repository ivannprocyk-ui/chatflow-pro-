import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║     🚀 ChatFlow Pro Backend API 🚀           ║
  ║                                              ║
  ║     Running on: http://localhost:${port}      ║
  ║     API Docs: http://localhost:${port}/api    ║
  ║                                              ║
  ║     Database: ${process.env.USE_DATABASE === 'true' ? 'PostgreSQL' : 'Mock Data (Memory)'}      ║
  ║     Flowise: ${process.env.FLOWISE_API_URL || 'Not configured'}  ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
}

bootstrap();
