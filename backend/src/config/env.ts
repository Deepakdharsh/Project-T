import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    MONGODB_URI: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(20),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(20),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // Used to sign booking QR scan tokens. If not provided, we fall back to JWT_ACCESS_SECRET.
    QR_SCAN_SECRET: z.string().optional(),
    QR_SCAN_EXPIRES_IN: z.string().default('30d'),

    CORS_ORIGINS: z.string().default('http://localhost:3000'),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),

    // Razorpay (backend only)
    RAZORPAY_KEY_ID: z.string().min(1).optional(),
    RAZORPAY_KEY_SECRET: z.string().min(1).optional(),

    // Email (optional; failures should not block payment confirmation)
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    SMTP_FROM: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGINS.split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);


