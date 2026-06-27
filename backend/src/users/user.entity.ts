import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true })
  verificationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationTokenExpires: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordTokenExpires: Date | null;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
