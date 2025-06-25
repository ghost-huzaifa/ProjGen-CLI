import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import { setupSwagger } from './swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service and determine port.
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  // Set up global validation pipe.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  // Clear the AccessToken cookie on backend start
  const cookieName = configService.get<string>('AUTH_COOKIE_NAME') || 'AccessToken';
  const cookieDomain = configService.get<string>('AUTH_COOKIE_DOMAIN');
  let cookieCleared = false;
  app.use((req, res, next) => {
    if (!cookieCleared) {
      res.clearCookie(cookieName, {
        httpOnly: false,
        sameSite: 'lax',
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
      cookieCleared = true;
    }
    next();
  });

  // Configure security with Helmet
  app.use(
    helmet({
      // Allow WebSockets
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null,
          // Allow WebSocket connections
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
    }),
  );

  // Configure CORS
  app.use(
    cors({
      origin: configService.get<string>('CORS_ALLOWED_ORIGINS')?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    }),
  );

  // Configure API prefix
  // app.setGlobalPrefix('api');
  app.setGlobalPrefix(`${process.env.URL_PREFIX ?? 'apis/v1'}`);

  // Swagger setup
  // if (process.env?.PRODUCTION === '0') {
    setupSwagger(app);
  // }

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger is available at: http://localhost:${port}/apis/v1/swagger`);
}

void bootstrap();
