import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { requestIdMiddleware } from './monitoring/request-id.middleware';
import { ErrorAlertService } from './monitoring/error-alert.service';
import { getUploadDir } from './common/utils/upload.util';

async function bootstrap() {
  console.log('Starting NestJS application...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Match allowed origins or Vercel preview domains
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS error: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
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

  // Tag each request so a user-visible 500 can be matched to its alert email.
  // Exceptions (incl. Prisma error mapping) are handled by AllExceptionsFilter,
  // registered as APP_FILTER in MonitoringModule, which emails the team on 5xx.
  app.use(requestIdMiddleware);

  const errorAlerts = app.get(ErrorAlertService);
  process.on('unhandledRejection', (reason) => {
    void errorAlerts.report(reason, { source: 'process:unhandledRejection' });
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Keep Node's default crash-on-uncaught behaviour, but alert first.
    void errorAlerts
      .report(error, { source: 'process:uncaughtException' })
      .finally(() => process.exit(1));
  });

  // Static file serving (uploads)
  const uploadsDir = getUploadDir();
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

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
    .addTag('subscriptions', 'SaaS Plan Subscriptions')
    .addTag('monitoring', 'Error reporting & alerts')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  console.log('About to listen on port:', port);

  await app.listen(port, '0.0.0.0');

  console.log('Server started successfully');

  console.log(`🚀 Arogyix API running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
