import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerDoc = new DocumentBuilder()
    .setTitle('Proyecto Final Roots Cooperativa')
    .setVersion('1.0.0')
    .setDescription('Sitio Web Cooperativa de Trabajo Roots ltda')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
