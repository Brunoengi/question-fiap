import { IsString, IsEnum } from 'class-validator';
import { SubjectLevel } from '../entities/subject.entity';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsEnum(SubjectLevel)
  level: SubjectLevel;
}
