import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, MessageRole } from './entities/chat-message.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { SaveQuestionDto } from './dto/save-question.dto';
import type { IAiProvider } from './interfaces/ai-provider.interface';
import { SubjectsService } from '../subjects/subjects.service';
import { TopicsService } from '../subjects/topics.service';
import { QuestionsService } from '../questions/questions.service';
import { QuestionType, QuestionSource, Difficulty } from '../questions/entities/question.entity';
import type { CreateQuestionDto } from '../questions/dto/create-question.dto';

const SYSTEM_PROMPT_TEMPLATE = `
Você é um assistente educacional especializado em criar questões para o ensino fundamental e médio. Gere questões claras e pedagogicamente corretas. Para múltipla escolha, forneça exatamente {N} alternativas (A-E). Apenas uma correta. Retorne no formato JSON: { "statement", "type": "multiple_choice"|"descriptive", "alternatives": [{ "label", "text", "isCorrect" }], "solution", "difficulty": "easy"|"medium"|"hard" }
`.trim();

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @Inject('AI_PROVIDER')
    private readonly aiProvider: IAiProvider,
    private readonly subjectsService: SubjectsService,
    private readonly topicsService: TopicsService,
    private readonly questionsService: QuestionsService,
  ) {}

  async createSession(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<ChatSession> {
    const subject = await this.subjectsService.findOne(dto.subjectId, userId);
    const topic = await this.topicsService.findOne(dto.topicId);

    const session = this.sessionRepository.create({
      userId,
      subjectId: dto.subjectId,
      topicId: dto.topicId,
      title: `${topic.name} - ${subject.name}`,
      alternativesCount: dto.alternativesCount ?? 5,
    });

    return this.sessionRepository.save(session);
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      relations: { subject: true, topic: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async getSession(id: string, userId: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findOne({
      where: { id, userId },
      relations: { messages: true, subject: true, topic: true },
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!session) {
      throw new NotFoundException('Sessão de chat não encontrada');
    }

    return session;
  }

  async deleteSession(id: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException('Sessão de chat não encontrada');
    }

    await this.sessionRepository.remove(session);
  }

  async *sendMessage(
    sessionId: string,
    userId: string,
    content: string,
  ): AsyncIterable<string> {
    const session = await this.getSession(sessionId, userId);

    const userMessage = this.messageRepository.create({
      sessionId,
      role: MessageRole.USER,
      content,
    });
    await this.messageRepository.save(userMessage);

    const history: { role: string; content: string }[] = session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    history.push({ role: 'user' as const, content });

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace(
      '{N}',
      String(session.alternativesCount),
    );

    const assistantMessage = this.messageRepository.create({
      sessionId,
      role: MessageRole.ASSISTANT,
      content: '',
    });

    let fullContent = '';

    try {
      for await (const token of this.aiProvider.chat(history, systemPrompt)) {
        fullContent += token;
        yield token;
      }
    } finally {
      assistantMessage.content = fullContent;

      const questionData = this.extractJsonFromContent(fullContent);
      if (questionData) {
        assistantMessage.questionData = questionData;
      }

      await this.messageRepository.save(assistantMessage);
    }
  }

  async saveQuestion(dto: SaveQuestionDto): Promise<void> {
    const difficultyMap: Record<string, Difficulty> = {
      easy: Difficulty.EASY,
      medium: Difficulty.MEDIUM,
      hard: Difficulty.HARD,
    };

    await this.questionsService.create(dto.questionData.userId ?? '', {
      subjectId: dto.questionData.subjectId,
      topicId: dto.questionData.topicId,
      statement: dto.questionData.statement,
      type: dto.questionData.type === 'multiple_choice' ? QuestionType.MULTIPLE_CHOICE : QuestionType.DESCRIPTIVE,
      difficulty: difficultyMap[dto.questionData.difficulty ?? 'medium'] ?? Difficulty.MEDIUM,
      solution: dto.questionData.solution,
      source: QuestionSource.AI_GENERATED,
      alternatives: dto.questionData.alternatives?.map((alt: any, i: number) => ({
        label: alt.label,
        text: alt.text,
        isCorrect: alt.isCorrect,
        order: alt.order ?? i,
      })),
    });
  }

  private extractJsonFromContent(content: string): Record<string, any> | null {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
