import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsDateString,
  IsObject,
  ValidateNested,
  IsNumber,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamQuestionDto {
  @IsUUID()
  questionId: string;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsNumber()
  points: number | null;
}

export class CreateExamDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsUUID()
  subjectId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  topicIds?: string[];

  @IsOptional()
  @IsString()
  instructions?: string | null;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsDateString()
  examDate?: Date | null;

  @IsOptional()
  @IsObject()
  headerFields?: {
    studentName: boolean;
    date: boolean;
    className: boolean;
    grade: boolean;
  };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExamQuestionDto)
  questions: CreateExamQuestionDto[];
}
