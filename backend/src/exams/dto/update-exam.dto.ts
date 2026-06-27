import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsDateString,
  IsObject,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
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
}
