import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { Topic } from '../topics/topic.entity';
import { SubjectsService } from './subjects.service';
import { TopicsService } from './topics.service';
import { SubjectsController } from './subjects.controller';
import { TopicsController } from './topics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Topic])],
  providers: [SubjectsService, TopicsService],
  controllers: [SubjectsController, TopicsController],
  exports: [SubjectsService, TopicsService],
})
export class SubjectsModule {}
