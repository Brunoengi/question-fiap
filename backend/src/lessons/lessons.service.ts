import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, SubjectLevel } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/topic.entity';
import { Question, QuestionType, Difficulty, QuestionSource, QuestionStatus } from '../questions/entities/question.entity';
import { Alternative } from '../questions/entities/alternative.entity';
import { Exam, ExamStatus } from '../exams/entities/exam.entity';
import { ExamQuestion } from '../exams/entities/exam-question.entity';
import type { IAiProvider } from '../chat/interfaces/ai-provider.interface';
import { GenerateLessonDto, LessonDifficulty, LessonQuestionType } from './dto/generate-lesson.dto';

const MULTIPLE_CHOICE_QUESTION_FORMAT = `    {
      "statement": "Enunciado da questão?",
      "alternatives": [
        { "label": "A", "text": "Texto da alternativa A", "isCorrect": false },
        { "label": "B", "text": "Texto da alternativa B", "isCorrect": true },
        { "label": "C", "text": "Texto da alternativa C", "isCorrect": false },
        { "label": "D", "text": "Texto da alternativa D", "isCorrect": false }
      ],
      "solution": "Explicação detalhada da resposta correta."
    }`;

const DESCRIPTIVE_QUESTION_FORMAT = `    {
      "statement": "Enunciado dissertativo da questão?",
      "alternatives": [],
      "solution": "Resposta esperada / gabarito comentado."
    }`;

function buildSystemPrompt(tipoQuestao: LessonQuestionType): string {
  const questionFormat =
    tipoQuestao === LessonQuestionType.MULTIPLE_CHOICE
      ? MULTIPLE_CHOICE_QUESTION_FORMAT
      : DESCRIPTIVE_QUESTION_FORMAT;

  return `
Você é um assistente educacional especializado em criar aulas completas para o ensino médio.
Gere o conteúdo pedagógico em português brasileiro.
Retorne APENAS um JSON válido, sem texto antes ou depois, no seguinte formato:
{
  "content": "## Título\\n\\nConteúdo em markdown com seções ##, listas, fórmulas, etc.",
  "objectives": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "questions": [
${questionFormat}
  ]
}
`.trim();
}

const DIFFICULTY_MAP: Record<LessonDifficulty, Difficulty> = {
  [LessonDifficulty.FACIL]: Difficulty.EASY,
  [LessonDifficulty.MEDIO]: Difficulty.MEDIUM,
  [LessonDifficulty.DIFICIL]: Difficulty.HARD,
};

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Alternative)
    private readonly alternativeRepo: Repository<Alternative>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepo: Repository<ExamQuestion>,
    @Inject('AI_PROVIDER')
    private readonly aiProvider: IAiProvider,
  ) {}

  async *generate(userId: string, dto: GenerateLessonDto): AsyncIterable<string> {
    const isMultipleChoice = dto.tipoQuestao === LessonQuestionType.MULTIPLE_CHOICE;

    const tipoLabel = isMultipleChoice
      ? 'de múltipla escolha'
      : 'descritivas (dissertativas)';
    const userMessage = `Crie uma aula completa sobre "${dto.tema}" com ${dto.quantidadeQuestoes} questões ${tipoLabel} no nível ${dto.dificuldade}.${
      isMultipleChoice ? ' Cada questão deve ter exatamente 4 alternativas (A, B, C, D).' : ''
    }`;

    let fullContent = '';
    for await (const token of this.aiProvider.chat(
      [{ role: 'user', content: userMessage }],
      buildSystemPrompt(dto.tipoQuestao),
    )) {
      fullContent += token;
      yield token;
    }

    const lessonData = this.extractJson(fullContent);
    if (!lessonData) {
      yield JSON.stringify({ error: 'Falha ao interpretar resposta da IA' });
      return;
    }

    const subject = await this.findOrCreateSubject(userId, dto.tema);
    const topic = await this.findOrCreateTopic(userId, subject.id, dto.tema);

    const difficulty = DIFFICULTY_MAP[dto.dificuldade];
    const savedQuestions: Question[] = [];

    for (const q of lessonData.questions ?? []) {
      const question = this.questionRepo.create({
        userId,
        subjectId: subject.id,
        topicId: topic.id,
        statement: q.statement,
        type: isMultipleChoice ? QuestionType.MULTIPLE_CHOICE : QuestionType.DESCRIPTIVE,
        difficulty,
        solution: q.solution ?? '',
        source: QuestionSource.AI_GENERATED,
        status: QuestionStatus.PUBLISHED,
        tags: [],
      });
      const saved = await this.questionRepo.save(question);

      const alternatives = (isMultipleChoice ? q.alternatives ?? [] : []).map((alt: any, i: number) =>
        this.alternativeRepo.create({
          questionId: saved.id,
          label: alt.label,
          text: alt.text,
          isCorrect: alt.isCorrect,
          order: i,
        }),
      );
      await this.alternativeRepo.save(alternatives);
      savedQuestions.push(saved);
    }

    const exam = this.examRepo.create({
      userId,
      title: dto.tema,
      subjectId: subject.id,
      topicIds: [topic.id],
      content: lessonData.content ?? null,
      objectives: lessonData.objectives ?? [],
      status: ExamStatus.FINALIZED,
      examQuestions: savedQuestions.map((q, i) =>
        this.examQuestionRepo.create({ questionId: q.id, order: i + 1, points: null }),
      ),
    });

    const savedExam = await this.examRepo.save(exam);
    yield JSON.stringify({ done: true, examId: savedExam.id });
  }

  private async findOrCreateSubject(userId: string, name: string): Promise<Subject> {
    let subject = await this.subjectRepo.findOne({ where: { userId, name } });
    if (!subject) {
      subject = await this.subjectRepo.save(
        this.subjectRepo.create({ userId, name, level: SubjectLevel.MEDIO }),
      );
    }
    return subject;
  }

  private async findOrCreateTopic(userId: string, subjectId: string, name: string): Promise<Topic> {
    let topic = await this.topicRepo.findOne({ where: { userId, subjectId, name } });
    if (!topic) {
      topic = await this.topicRepo.save(
        this.topicRepo.create({ userId, subjectId, name, isActive: true }),
      );
    }
    return topic;
  }

  private extractJson(content: string): Record<string, any> | null {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
