import { IsArray, IsUUID, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQuestionItemDto {
  @IsUUID()
  questionId: string;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsNumber()
  points: number | null;
}

export class UpdateQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionItemDto)
  questions: UpdateQuestionItemDto[];
}
