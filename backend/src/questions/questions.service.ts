import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionStatus } from './entities/question.entity';
import { Alternative } from './entities/alternative.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Alternative)
    private readonly alternativeRepository: Repository<Alternative>,
  ) {}

  async findAll(userId: string, query: QueryQuestionsDto) {
    const {
      search,
      subjectId,
      topicId,
      type,
      difficulty,
      status,
      source,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.alternatives', 'alternative')
      .where('question.userId = :userId', { userId })
      .andWhere('question.isActive = :isActive', { isActive: true });

    if (search) {
      qb.andWhere('question.statement ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (subjectId) {
      qb.andWhere('question.subjectId = :subjectId', { subjectId });
    }

    if (topicId) {
      qb.andWhere('question.topicId = :topicId', { topicId });
    }

    if (type) {
      qb.andWhere('question.type = :type', { type });
    }

    if (difficulty) {
      qb.andWhere('question.difficulty = :difficulty', { difficulty });
    }

    if (status) {
      qb.andWhere('question.status = :status', { status });
    }

    if (source) {
      qb.andWhere('question.source = :source', { source });
    }

    qb.orderBy(`question.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id, userId, isActive: true },
      relations: { alternatives: true },
    });

    if (!question) {
      throw new NotFoundException('Questão não encontrada');
    }

    return question;
  }

  async create(userId: string, dto: CreateQuestionDto): Promise<Question> {
    const { alternatives, ...data } = dto;
    const question = this.questionRepository.create({
      ...data,
      userId,
    });

    if (alternatives && alternatives.length > 0) {
      question.alternatives = alternatives.map((alt) =>
        this.alternativeRepository.create(alt),
      );
    }

    return this.questionRepository.save(question);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.findOne(userId, id);
    const { alternatives, ...data } = dto;

    Object.assign(question, data);

    if (alternatives !== undefined) {
      await this.alternativeRepository.delete({ questionId: id });
      question.alternatives = alternatives.map((alt) =>
        this.alternativeRepository.create(alt),
      );
    }

    return this.questionRepository.save(question);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const question = await this.findOne(userId, id);
    question.isActive = false;
    await this.questionRepository.save(question);
  }

  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateStatusDto,
  ): Promise<Question> {
    const question = await this.findOne(userId, id);
    question.status = dto.status;
    return this.questionRepository.save(question);
  }

  async duplicate(userId: string, id: string): Promise<Question> {
    const original = await this.findOne(userId, id);

    const newQuestion = this.questionRepository.create({
      userId: original.userId,
      subjectId: original.subjectId,
      topicId: original.topicId,
      statement: original.statement,
      type: original.type,
      difficulty: original.difficulty,
      solution: original.solution,
      source: original.source,
      tags: original.tags,
      status: QuestionStatus.DRAFT,
      isActive: true,
    });

    if (original.alternatives && original.alternatives.length > 0) {
      newQuestion.alternatives = original.alternatives.map((alt) =>
        this.alternativeRepository.create({
          label: alt.label,
          text: alt.text,
          isCorrect: alt.isCorrect,
          order: alt.order,
        }),
      );
    }

    return this.questionRepository.save(newQuestion);
  }

  async findTrash(userId: string, query: QueryQuestionsDto) {
    const { page = 1, limit = 10, sortBy = 'updatedAt', sortOrder = 'DESC' } = query;

    const qb = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.alternatives', 'alternative')
      .where('question.userId = :userId', { userId })
      .andWhere('question.isActive = :isActive', { isActive: false })
      .orderBy(`question.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async restore(userId: string, id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id, userId, isActive: false },
    });

    if (!question) {
      throw new NotFoundException('Questão não encontrada na lixeira');
    }

    question.isActive = true;
    return this.questionRepository.save(question);
  }

  async batchDelete(userId: string, dto: BatchDeleteDto): Promise<void> {
    await this.questionRepository
      .createQueryBuilder()
      .update(Question)
      .set({ isActive: false })
      .where('userId = :userId', { userId })
      .andWhere('id IN (:...ids)', { ids: dto.ids })
      .execute();
  }
}
