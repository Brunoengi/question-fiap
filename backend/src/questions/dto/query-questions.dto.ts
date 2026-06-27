import { IsOptional, IsEnum, IsUUID, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, Difficulty, QuestionSource, QuestionStatus } from '../entities/question.entity';

export class QueryQuestionsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsEnum(QuestionSource)
  source?: QuestionSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
