import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
   const config = new DocumentBuilder()
     .setTitle('QuickMemo API')
     .setDescription('The API description')
     .setVersion('1.0')
     .addTag('cats')
     .build();
   const document = SwaggerModule.createDocument(app, config);
   SwaggerModule.setup('api', app, document);
  await app.listen(53361);
}
bootstrap();
