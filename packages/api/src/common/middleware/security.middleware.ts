// ============================================================
// Security Middleware — Helmet, CORS, CSP, HIPAA headers
// ============================================================

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
    private readonly logger = new Logger(SecurityHeadersMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        // --- HSTS (HTTP Strict Transport Security) ---
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        // --- Content Security Policy ---
        res.setHeader('Content-Security-Policy', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js requires inline scripts
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.fda.gov https://rxnav.nlm.nih.gov https://api.anthropic.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '));

        // --- Prevent clickjacking ---
        res.setHeader('X-Frame-Options', 'DENY');

        // --- Prevent MIME sniffing ---
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // --- Referrer Policy ---
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // --- Permissions Policy (restrict browser features) ---
        res.setHeader('Permissions-Policy', [
            'camera=(self)',         // Allow camera for barcode scanning
            'microphone=()',         // Deny microphone
            'geolocation=()',        // Deny geolocation
            'payment=()',            // Deny payment
            'usb=()',                // Deny USB
        ].join(', '));

        // --- HIPAA: Prevent caching of sensitive data ---
        if (req.path.startsWith('/api/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }

        // --- Cross-Origin headers ---
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

        next();
    }
}

@Injectable()
export class RequestSanitizerMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction) {
        // Sanitize query parameters — strip any script tags
        if (req.query) {
            for (const [key, value] of Object.entries(req.query)) {
                if (typeof value === 'string') {
                    (req.query as any)[key] = value.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
                }
            }
        }

        // Limit request body size check (Express default is 100kb, but we enforce)
        if (req.headers['content-length']) {
            const size = parseInt(req.headers['content-length']);
            if (size > 1048576) { // 1MB max
                _res.status(413).json({ error: 'Request body too large' });
                return;
            }
        }

        next();
    }
}

@Injectable()
export class HipaaAuditMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HIPAA_AUDIT');

    use(req: Request, res: Response, next: NextFunction) {
        // Log all API access attempts for HIPAA compliance
        if (req.path.startsWith('/api/') && req.path !== '/api/health') {
            const start = Date.now();

            res.on('finish', () => {
                const duration = Date.now() - start;
                this.logger.log(
                    `${req.method} ${req.path} ${res.statusCode} ${duration}ms ` +
                    `IP=${req.ip} UA=${(req.headers['user-agent'] || '').substring(0, 50)}`,
                );
            });
        }

        next();
    }
}
