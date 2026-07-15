import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { AutoSelectDto } from './dto/auto-select.dto';
import { UpdateQuestionsDto } from './dto/update-questions.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Question } from '../questions/entities/question.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  private removeInactiveQuestions(exam: Exam): Exam {
    exam.examQuestions = (exam.examQuestions ?? []).filter(
      (eq) => eq.question?.isActive,
    );
    return exam;
  }

  async findAll(userId: string): Promise<Exam[]> {
    const exams = await this.examRepository.find({
      where: { userId },
      relations: {
        subject: true,
        examQuestions: { question: true },
      },
      order: { createdAt: 'DESC' },
    });

    return exams.map((exam) => this.removeInactiveQuestions(exam));
  }

  async findOne(id: string, userId: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id, userId },
      relations: {
        subject: true,
        examQuestions: { question: { alternatives: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('Prova não encontrada');
    }

    return this.removeInactiveQuestions(exam);
  }

  async create(userId: string, dto: CreateExamDto): Promise<Exam> {
    const exam = this.examRepository.create({
      userId,
      title: dto.title,
      subjectId: dto.subjectId,
      topicIds: dto.topicIds ?? [],
      instructions: dto.instructions ?? null,
      content: dto.content ?? null,
      objectives: dto.objectives ?? [],
      examDate: dto.examDate ?? null,
      headerFields: dto.headerFields ?? {
        studentName: true,
        date: true,
        className: true,
        grade: true,
      },
      examQuestions: dto.questions.map((q) =>
        this.examQuestionRepository.create({
          questionId: q.questionId,
          order: q.order,
          points: q.points ?? null,
        }),
      ),
    });

    return this.examRepository.save(exam);
  }

  async update(id: string, userId: string, dto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id, userId);

    if (dto.title !== undefined) exam.title = dto.title;
    if (dto.subjectId !== undefined) exam.subjectId = dto.subjectId;
    if (dto.topicIds !== undefined) exam.topicIds = dto.topicIds;
    if (dto.instructions !== undefined) exam.instructions = dto.instructions;
    if (dto.content !== undefined) exam.content = dto.content;
    if (dto.objectives !== undefined) exam.objectives = dto.objectives;
    if (dto.examDate !== undefined) exam.examDate = dto.examDate;
    if (dto.headerFields !== undefined) exam.headerFields = dto.headerFields;

    return this.examRepository.save(exam);
  }

  async remove(id: string, userId: string): Promise<void> {
    const exam = await this.findOne(id, userId);

    const examQuestions = await this.examQuestionRepository.find({
      where: { examId: id },
    });
    const questionIds = examQuestions.map((eq) => eq.questionId);

    await this.examRepository.remove(exam);

    if (questionIds.length > 0) {
      await this.questionRepository
        .createQueryBuilder()
        .update(Question)
        .set({ isActive: false })
        .where('userId = :userId', { userId })
        .andWhere('id IN (:...ids)', { ids: questionIds })
        .execute();
    }
  }

  async updateStatus(id: string, userId: string, dto: UpdateStatusDto): Promise<Exam> {
    const exam = await this.findOne(id, userId);
    exam.status = dto.status;
    return this.examRepository.save(exam);
  }

  async autoSelect(
    dto: AutoSelectDto,
  ): Promise<{ multipleChoice: Question[]; descriptive: Question[]; total: number }> {
    const questionRepo = this.examQuestionRepository.manager.getRepository(Question);

    const multipleChoiceQb = questionRepo
      .createQueryBuilder('q')
      .where('q.type = :type', { type: 'MULTIPLE_CHOICE' })
      .andWhere('q.status = :status', { status: 'PUBLISHED' })
      .andWhere('q.isActive = :isActive', { isActive: true })
      .andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });

    const descriptiveQb = questionRepo
      .createQueryBuilder('q')
      .where('q.type = :type', { type: 'DESCRIPTIVE' })
      .andWhere('q.status = :status', { status: 'PUBLISHED' })
      .andWhere('q.isActive = :isActive', { isActive: true })
      .andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });

    if (dto.difficulty) {
      multipleChoiceQb.andWhere('q.difficulty = :difficulty', { difficulty: dto.difficulty });
      descriptiveQb.andWhere('q.difficulty = :difficulty', { difficulty: dto.difficulty });
    }

    multipleChoiceQb.orderBy('RANDOM()').limit(dto.multipleChoiceCount);
    descriptiveQb.orderBy('RANDOM()').limit(dto.descriptiveCount);

    const [multipleChoice, descriptive] = await Promise.all([
      multipleChoiceQb.getMany(),
      descriptiveQb.getMany(),
    ]);

    return {
      multipleChoice,
      descriptive,
      total: multipleChoice.length + descriptive.length,
    };
  }

  async updateQuestions(id: string, userId: string, dto: UpdateQuestionsDto): Promise<Exam> {
    const exam = await this.findOne(id, userId);

    await this.examQuestionRepository.delete({ examId: exam.id });

    exam.examQuestions = dto.questions.map((q) =>
      this.examQuestionRepository.create({
        examId: exam.id,
        questionId: q.questionId,
        order: q.order,
        points: q.points ?? null,
      }),
    );

    return this.examRepository.save(exam);
  }

  async reorderQuestions(id: string, userId: string, dto: ReorderQuestionsDto): Promise<Exam> {
    const exam = await this.findOne(id, userId);

    const orderMap = new Map(dto.questions.map((q) => [q.questionId, q.order]));

    for (const eq of exam.examQuestions) {
      const newOrder = orderMap.get(eq.questionId);
      if (newOrder !== undefined) {
        eq.order = newOrder;
      }
    }

    await this.examQuestionRepository.save(exam.examQuestions);
    return this.findOne(id, userId);
  }
}
