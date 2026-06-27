import { IsInt, IsUUID, IsOptional, Min } from 'class-validator';

export class AutoSelectDto {
  @IsInt()
  @Min(1)
  totalCount: number;

  @IsInt()
  @Min(0)
  multipleChoiceCount: number;

  @IsInt()
  @Min(0)
  descriptiveCount: number;

  @IsUUID()
  subjectId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  difficulty?: number;
}
