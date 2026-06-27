import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubjectsModule } from './subjects/subjects.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';
import { ChatModule } from './chat/chat.module';
import { LessonsModule } from './lessons/lessons.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    AuthModule,
    UsersModule,
    SubjectsModule,
    QuestionsModule,
    ExamsModule,
    ChatModule,
    LessonsModule,
  ],
})
export class AppModule {}
