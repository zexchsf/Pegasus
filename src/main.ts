import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionFilter } from './common/filters/exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = new Logger('NestApplication');

  // middlewares
  app.enableCors();

  //filter
  app.useGlobalFilters(new AllExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Pegasus')
    .setDescription('Pegasus Banking API Documentation')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      name: 'authorization',
      in: 'headers',
      bearerFormat: 'Bearer ',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('PORT');

  await app.listen(port);
  logger.log(`Nest Application running on port ${port}`);
}

bootstrap();
