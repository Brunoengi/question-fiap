import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  subjectId: string;

  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(10)
  alternativesCount?: number;
}
