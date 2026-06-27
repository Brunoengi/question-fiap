import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { ExamQuestion } from './exam-question.entity';

export enum ExamStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column({ type: 'jsonb', default: [] })
  topicIds: string[];

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'jsonb', default: [] })
  objectives: string[];

  @Column({ type: 'date', nullable: true })
  examDate: Date | null;

  @Column({ type: 'enum', enum: ExamStatus, default: ExamStatus.DRAFT })
  status: ExamStatus;

  @Column({
    type: 'jsonb',
    default: { studentName: true, date: true, className: true, grade: true },
  })
  headerFields: {
    studentName: boolean;
    date: boolean;
    className: boolean;
    grade: boolean;
  };

  @OneToMany(() => ExamQuestion, (eq) => eq.exam, { cascade: true })
  examQuestions: ExamQuestion[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
