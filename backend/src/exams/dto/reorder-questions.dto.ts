import { IsArray, IsUUID, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderQuestionItemDto {
  @IsUUID()
  questionId: string;

  @IsNumber()
  order: number;
}

export class ReorderQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderQuestionItemDto)
  questions: ReorderQuestionItemDto[];
}
