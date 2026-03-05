// ============================================================
// MedMinder API — Application Entry Point
// ============================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/monitoring/sentry';
import { getCorsConfig } from './common/config/cors.config';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    // Security
    app.use(helmet());
    app.use(cookieParser());
    app.enableCors(getCorsConfig());

    // Global exception filter (Sentry integration)
    app.useGlobalFilters(new SentryExceptionFilter());

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Swagger API Documentation
    const config = new DocumentBuilder()
        .setTitle('MedMinder API')
        .setDescription('Medication Reminder + Interaction Checker API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Graceful shutdown
    app.enableShutdownHooks();

    const port = process.env.PORT || 4000;
    await app.listen(port);
    logger.log(`🏥 MedMinder API running on http://localhost:${port}`);
    logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
    logger.log(`🔒 CORS origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`);
}

bootstrap();

