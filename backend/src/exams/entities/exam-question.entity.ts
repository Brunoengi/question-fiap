import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exam } from './exam.entity';
import { Question } from '../../questions/entities/question.entity';

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  examId: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Column({ type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  points: number | null;
}
