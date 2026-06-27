import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from './question.entity';

@Entity('alternatives')
export class Alternative {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'varchar', length: 1 })
  label: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'int' })
  order: number;

  @ManyToOne(() => Question, (question) => question.alternatives, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
