import { IsEnum } from 'class-validator';
import { ExamStatus } from '../entities/exam.entity';

export class UpdateStatusDto {
  @IsEnum(ExamStatus)
  status: ExamStatus;
}
