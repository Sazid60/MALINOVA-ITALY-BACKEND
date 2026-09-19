import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');

  // Cookie parser — required for httpOnly cookie auth
  app.use(cookieParser());

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server or mobile apps) or any origin in dev
      if (!origin || corsOrigin === '*' || corsOrigin.split(',').map(o => o.trim()).includes(origin)) {
        callback(null, origin || true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Achar Shop Admin API')
    .setDescription(
      'Full backend for Achar Shop Admin Panel — Orders, Products, Inventory, CRM, Finance, CMS, Notifications',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .addTag('Auth')
    .addTag('Dashboard')
    .addTag('Users')
    .addTag('Roles & Permissions')
    .addTag('Customers')
    .addTag('Products')
    .addTag('Orders')
    .addTag('Inventory')
    .addTag('Suppliers')
    .addTag('Finance')
    .addTag('Marketing')
    .addTag('CMS')
    .addTag('Notifications')
    .addTag('Delivery')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Achar Shop API Docs',
  });

  const listenPort = process.env.PORT || port;
  await app.listen(listenPort);
  Logger.log(`🚀 API running at http://localhost:${listenPort}/${apiPrefix}`);
  Logger.log(`📚 Swagger at  http://localhost:${port}/docs`);
  Logger.log(`🔐 Login:      POST /${apiPrefix}/auth/login`);
}

bootstrap();
