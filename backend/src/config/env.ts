import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const nodeEnv = optional('NODE_ENV', 'development');

/**
 * Single source of truth for environment variables.
 * Import `env` from here instead of reading `process.env` directly.
 */
export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',

  port: Number(optional('PORT', '5000')),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),

  mongoUri: required('MONGO_URI'),

  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME'),
    apiKey: required('CLOUDINARY_API_KEY'),
    apiSecret: required('CLOUDINARY_API_SECRET'),
  },

  groqApiKey: required('GROQ_API_KEY'),

  resend: {
    apiKey: required('RESEND_API_KEY'),
    fromEmail: optional('RESEND_FROM_EMAIL', 'onboarding@resend.dev'),
  },

  jwt: {
    accessSecret: required('ACCESS_TOKEN_SECRET'),
    refreshSecret: required('REFRESH_TOKEN_SECRET'),
  },

  admin: {
    email: required('ADMIN_EMAIL'),
    password: required('ADMIN_PASSWORD'),
    name: optional('ADMIN_NAME', 'Admin'),
  },
} as const;
