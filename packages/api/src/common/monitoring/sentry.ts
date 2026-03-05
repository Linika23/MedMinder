// ============================================================
// Sentry — Backend Error Tracking Integration
// ============================================================

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// ── Sentry Initialization ──
// In production, import * as Sentry from '@sentry/node' and initialize
// For now, we provide a lightweight wrapper that logs in dev and sends to Sentry in prod

interface SentryLike {
    captureException(error: unknown, context?: Record<string, unknown>): void;
    captureMessage(message: string, level?: string): void;
    setUser(user: { id: string; email?: string } | null): void;
}

class DevSentry implements SentryLike {
    private readonly logger = new Logger('Sentry:Dev');
    captureException(error: unknown) {
        this.logger.error(`[DEV] Would send to Sentry: ${error}`);
    }
    captureMessage(message: string, level = 'info') {
        this.logger.log(`[DEV] Sentry ${level}: ${message}`);
    }
    setUser(user: { id: string; email?: string } | null) {
        this.logger.debug(`[DEV] Sentry user: ${user?.id || 'anonymous'}`);
    }
}

class ProdSentry implements SentryLike {
    private sentry: any;

    constructor() {
        try {
            // Dynamic import so dev doesn't need @sentry/node installed
            this.sentry = require('@sentry/node');
            this.sentry.init({
                dsn: process.env.SENTRY_DSN,
                environment: process.env.NODE_ENV || 'development',
                tracesSampleRate: 0.2, // 20% of transactions for performance
                profilesSampleRate: 0.1,
                integrations: [],
            });
        } catch {
            console.warn('⚠️  @sentry/node not installed, falling back to dev logger');
            const fallback = new DevSentry();
            this.sentry = {
                captureException: fallback.captureException.bind(fallback),
                captureMessage: fallback.captureMessage.bind(fallback),
                setUser: fallback.setUser.bind(fallback),
            };
        }
    }

    captureException(error: unknown, context?: Record<string, unknown>) {
        this.sentry.captureException(error, context ? { extra: context } : undefined);
    }

    captureMessage(message: string, level = 'info') {
        this.sentry.captureMessage(message, level);
    }

    setUser(user: { id: string; email?: string } | null) {
        this.sentry.setUser(user);
    }
}

// Export singleton
export const sentry: SentryLike =
    process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN
        ? new ProdSentry()
        : new DevSentry();

// ── Global Exception Filter ──
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(SentryExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Only report 5xx errors to Sentry (not 4xx client errors)
        if (status >= 500) {
            sentry.captureException(exception, {
                url: request.url,
                method: request.method,
                statusCode: status,
                userAgent: request.headers['user-agent'],
            });
        }

        this.logger.error(
            `${request.method} ${request.url} → ${status}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        response.status(status).json({
            statusCode: status,
            message: typeof message === 'string' ? message : (message as any).message || message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
