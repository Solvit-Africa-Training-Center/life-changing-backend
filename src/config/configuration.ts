import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lceo',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-super-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Payment Gateways
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY || 'RWF',
    enableRwf: process.env.STRIPE_ENABLE_RWF === 'true',
  },

  paypack: {
    baseUrl: process.env.PAYPACK_BASE_URL || 'https://payments.paypack.rw/api',
    clientId: process.env.PAYPACK_CLIENT_ID,
    clientSecret: process.env.PAYPACK_CLIENT_SECRET,
    callbackUrl: process.env.PAYPACK_CALLBACK_URL,
  },

  // Africa's Talking
  africasTalking: {
    apiKey: process.env.AFRICAS_TALKING_API_KEY,
    username: process.env.AFRICAS_TALKING_USERNAME,
    shortCode: process.env.AFRICAS_TALKING_SHORT_CODE,
    senderId: process.env.AFRICAS_TALKING_SENDER_ID || 'LCEO',
  },

  // SendGrid
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@lceo.org',
    fromName: process.env.EMAIL_FROM_NAME || 'LCEO',
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'lceo',
  },

  // Kobo Toolbox
  kobo: {
    token: process.env.KOBO_TOOLBOX_TOKEN,
    baseUrl: process.env.KOBO_BASE_URL || 'https://kf.kobotoolbox.org',
    formIds: process.env.KOBO_FORM_IDS?.split(',') || [],
  },

  // Security
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
      limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
    },
  },

  // Features
  features: {
    enableUSSD: process.env.ENABLE_USSD !== 'false',
    enableOfflineSync: process.env.ENABLE_OFFLINE_SYNC !== 'false',
    enableKoboSync: process.env.ENABLE_KOBO_SYNC !== 'false',
    enablePayment: process.env.ENABLE_PAYMENT !== 'false',
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  },

  // Payment Settings
  payment: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'RWF',
    exchangeRate: {
      usdToRwf: parseFloat(process.env.EXCHANGE_RATE_USD_TO_RWF || '1300'),
      eurToRwf: parseFloat(process.env.EXCHANGE_RATE_EUR_TO_RWF || '1400'),
    },
    enableStripe: process.env.ENABLE_STRIPE !== 'false',
    enablePaypack: process.env.ENABLE_PAYPACK !== 'false',
  },

}));
