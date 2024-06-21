import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestMinioModule } from 'nestjs-minio';
import { createClient } from '@supabase/supabase-js';

export const getDatabaseConfig = () => {
  const configService = new ConfigService();

  return TypeOrmModule.forRoot({
    type: 'mysql',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 3306),
    username: configService.get<string>('DB_USERNAME', 'myuser'),
    password: configService.get<string>('DB_PASSWORD', 'mypassword'),
    database: configService.get<string>('DB_DATABASE', 'mydatabase'),
    autoLoadEntities: true,
    synchronize: true,
    logger: 'simple-console',
    logging: true,
    charset: 'utf8mb4_bin',
    entities: [__dirname + '../entities/*.entity.{js,ts}'],
  });
};

export const getSupabaseConfig = () => {
  const configService = new ConfigService();
  return createClient(
    configService.get<string>('SUPABASE_URL'),
    configService.get<string>('SUPABASE_ANON_KEY'),
  );  
};

export const getRedisConfig = () => {
  const configService = new ConfigService();
  const host = configService.get<string>('REDIS_HOST', 'localhost');
  const port = configService.get<number>('REDIS_PORT', 6379);
  return RedisModule.forRoot({
    type: 'single',
    url: `redis://${host}:${port}`,
    options: {
      password: configService.get<string>('REDIS_PASSWORD', 'password'),
      db: 0, 
    },
  });
};

export const getMinioConfig = () => {
  const configService = new ConfigService();
  const endPoint = configService.get<string>('MINIO_ENDPOINT', 'localhost');
  const accessKey = configService.get<string>('MINIO_ACCESSKEY', 'accessKey');
  const secretKey = configService.get<string>('MINIO_SECRET_KEY', 'secretKey');

  return NestMinioModule.register({
    isGlobal: true,
    endPoint,
    port: 65311,
    accessKey,
    secretKey,
    useSSL: false,
  });
};
