import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'https://frontend-rootscoop.vercel.app',
      'https://roots-api-te93.onrender.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API de pruebas')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Frontend corriendo en https://frontend-rootscoop.vercel.app`);
  logger.log(`📚 Swagger en https://roots-api-te93.onrender.com/api/docs`);
  logger.log(`📚 Swagger en http://localhost:3000/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Error al iniciar:', error);
  process.exit(1);
});
