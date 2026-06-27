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
import { Topic } from '../../topics/topic.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  subjectId: string;

  @Column({ type: 'uuid' })
  topicId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'int', default: 5 })
  alternativesCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @OneToMany(() => ChatMessage, (message) => message.session, { cascade: true })
  messages: ChatMessage[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
