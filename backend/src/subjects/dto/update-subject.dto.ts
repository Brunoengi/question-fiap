import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SubjectLevel } from '../entities/subject.entity';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SubjectLevel)
  level?: SubjectLevel;
}
