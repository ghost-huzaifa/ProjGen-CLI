import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import firebaseConfig from './firebase.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [firebaseConfig],
      validationSchema: Joi.object({
        // Database config
        DATABASE_URL: Joi.string().required(),

        // JWT Configuration
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION: Joi.string().required(),

        // Auth Cookie Configuration
        AUTH_COOKIE_NAME: Joi.string().required(),
        AUTH_COOKIE_SECRET: Joi.string().required(),
        AUTH_COOKIE_DOMAIN: Joi.string().required(),

        // Application
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        CORS_ALLOWED_ORIGINS: Joi.string().required(),

        // Firebase config
        // FIREBASE_PROJECT_ID: Joi.string().required(),
        // FIREBASE_CLIENT_EMAIL: Joi.string().required(),
        // FIREBASE_PRIVATE_KEY: Joi.string().required(),
      }),
    }),
  ],
})
export class AppConfigModule {}
