import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { patchNestJsSwagger } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

dotenv.config();
const port = process.env.PORT;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  patchNestJsSwagger();

  app.enableCors();

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Advoga API')
    .setDescription(
      'Utilize essa documentação para realizar a integração com o nosso sistema',
    )
    .addBearerAuth({
      description: 'Token JWT',
      bearerFormat: 'JWT',
      scheme: 'bearer',
      type: 'http',
    })
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      authAction: {
        JWT: {
          name: 'JWT',
          schema: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          value: 'Bearer <token>',
        },
      },
    },
  });

  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port);
}
bootstrap();
