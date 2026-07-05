import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lifevault',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173'
};
