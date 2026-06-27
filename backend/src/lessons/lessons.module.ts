import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/topic.entity';
import { Question } from '../questions/entities/question.entity';
import { Alternative } from '../questions/entities/alternative.entity';
import { Exam } from '../exams/entities/exam.entity';
import { ExamQuestion } from '../exams/entities/exam-question.entity';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { DeepseekProvider } from '../chat/providers/deepseek.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, Topic, Question, Alternative, Exam, ExamQuestion]),
  ],
  providers: [
    LessonsService,
    DeepseekProvider,
    {
      provide: 'AI_PROVIDER',
      useClass: DeepseekProvider,
    },
  ],
  controllers: [LessonsController],
})
export class LessonsModule {}
