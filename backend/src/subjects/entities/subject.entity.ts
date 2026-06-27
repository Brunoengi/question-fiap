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
import { Topic } from '../../topics/topic.entity';

export enum SubjectLevel {
  FUNDAMENTAL_I = 'FUNDAMENTAL_I',
  FUNDAMENTAL_II = 'FUNDAMENTAL_II',
  MEDIO = 'MEDIO',
}

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: SubjectLevel })
  level: SubjectLevel;

  @OneToMany(() => Topic, (topic) => topic.subject, { cascade: true })
  topics: Topic[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
