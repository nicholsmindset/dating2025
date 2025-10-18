const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required for distributed rate limiting'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRE: z.string().default('7d'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  PUSHER_APP_ID: z.string().min(1, 'PUSHER_APP_ID is required'),
  PUSHER_KEY: z.string().min(1, 'PUSHER_KEY is required'),
  PUSHER_SECRET: z.string().min(1, 'PUSHER_SECRET is required'),
  PUSHER_CLUSTER: z.string().min(1, 'PUSHER_CLUSTER is required'),
  ADMIN_EMAILS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)
    ),
});

const env = EnvSchema.parse(process.env);

module.exports = {
  ...env,
  isProduction: env.NODE_ENV === 'production',
};
