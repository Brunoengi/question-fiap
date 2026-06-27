import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USER', 'question_user'),
  password: configService.get<string>('DB_PASSWORD', 'question_pass'),
  database: configService.get<string>('DB_NAME', 'question_db'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
});
