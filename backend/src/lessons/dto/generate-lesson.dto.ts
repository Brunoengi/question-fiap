import { IsString, IsInt, IsEnum, Min, Max } from 'class-validator';

export enum LessonDifficulty {
  FACIL = 'facil',
  MEDIO = 'medio',
  DIFICIL = 'dificil',
}

export enum LessonQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DESCRIPTIVE = 'DESCRIPTIVE',
}

export class GenerateLessonDto {
  @IsString()
  tema: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantidadeQuestoes: number;

  @IsEnum(LessonDifficulty)
  dificuldade: LessonDifficulty;

  @IsEnum(LessonQuestionType)
  tipoQuestao: LessonQuestionType;
}
