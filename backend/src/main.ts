import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Static file serving (uploads)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Arogyix API')
    .setDescription('Hospital Management SaaS Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('tenants', 'Hospital / Clinic Management')
    .addTag('users', 'User Management')
    .addTag('doctors', 'Doctor Management')
    .addTag('patients', 'Patient Management')
    .addTag('appointments', 'Appointment Management')
    .addTag('prescriptions', 'Prescription Management')
    .addTag('reports', 'Report Repository')
    .addTag('notifications', 'Notification Center')
    .addTag('chat', 'Chat System')
    .addTag('dashboard', 'Dashboard Analytics')
    .addTag('billing', 'Billing & Invoices')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Arogyix API running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
