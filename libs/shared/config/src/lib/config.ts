// libs/shared/config/src/lib/config.ts
import { registerAs } from '@nestjs/config';

console.log('Loading configuration...');
console.log(process.env['MONGO_URI'], 'MONGO_URI');

export const databaseConfig = registerAs('database', () => ({
  uri: process.env['MONGO_URI'] || 'mongodb://localhost:27017/wyecare',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
}));

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env['PORT'] || '3000', 10),
  environment: process.env['NODE_ENV'] || 'development',
  cors: {
    enabled: process.env['CORS_ENABLED'] === 'true',
    origin: process.env['CORS_ORIGIN'] || '*',
  },
}));
