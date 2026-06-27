import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Alternative } from './entities/alternative.entity';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Alternative])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
