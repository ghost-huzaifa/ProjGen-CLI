import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Code Craft Api')
    .setDescription('Backend API for Code Craft')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  Object.keys(document.paths).forEach((path) => {
    Object.keys(document.paths[path]).forEach((method) => {
      // Add the security requirement for each HTTP method on the path
      document.paths[path][method]['security'] = [{ bearerAuth: [] }];
    });
  });

  SwaggerModule.setup(`${process.env.URL_PREFIX ?? 'apis/v1'}/swagger`, app, document, {
    swaggerOptions: { displayRequestDuration: true },
  });
}
