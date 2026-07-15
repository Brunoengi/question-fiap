import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Topic } from '../../topics/topic.entity';
import { Alternative } from './alternative.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DESCRIPTIVE = 'DESCRIPTIVE',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum QuestionSource {
  AI_GENERATED = 'AI_GENERATED',
  MANUAL = 'MANUAL',
}

export enum QuestionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  subjectId: string;

  @Column({ type: 'uuid' })
  topicId: string;

  @Column({ type: 'text' })
  statement: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ type: 'enum', enum: Difficulty, default: Difficulty.MEDIUM })
  difficulty: Difficulty;

  @Column({ type: 'text', nullable: true })
  solution: string;

  @Column({ type: 'enum', enum: QuestionSource, default: QuestionSource.MANUAL })
  source: QuestionSource;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ type: 'enum', enum: QuestionStatus, default: QuestionStatus.PUBLISHED })
  status: QuestionStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @OneToMany(() => Alternative, (alternative) => alternative.question, {
    cascade: true,
  })
  alternatives: Alternative[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
