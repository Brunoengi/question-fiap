import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DeepseekProvider } from './providers/deepseek.provider';
import { SubjectsModule } from '../subjects/subjects.module';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    SubjectsModule,
    QuestionsModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: 'AI_PROVIDER',
      useClass: DeepseekProvider,
    },
    DeepseekProvider,
  ],
  exports: [ChatService],
})
export class ChatModule {}
