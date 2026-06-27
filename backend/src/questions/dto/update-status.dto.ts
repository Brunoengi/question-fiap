import { IsEnum } from 'class-validator';
import { QuestionStatus } from '../entities/question.entity';

export class UpdateStatusDto {
  @IsEnum(QuestionStatus)
  status: QuestionStatus;
}
