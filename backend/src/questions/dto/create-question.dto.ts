import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, Difficulty, QuestionSource, QuestionStatus } from '../entities/question.entity';
import { CreateAlternativeDto } from './create-alternative.dto';

export class CreateQuestionDto {
  @IsUUID()
  subjectId: string;

  @IsUUID()
  topicId: string;

  @IsString()
  statement: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsString()
  @IsOptional()
  solution?: string;

  @IsEnum(QuestionSource)
  @IsOptional()
  source?: QuestionSource;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAlternativeDto)
  @IsOptional()
  alternatives?: CreateAlternativeDto[];
}
