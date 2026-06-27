import { IsString, IsBoolean, IsInt, IsOptional, Length, Min } from 'class-validator';

export class CreateAlternativeDto {
  @IsString()
  @Length(1, 1)
  label: string;

  @IsString()
  text: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsInt()
  @Min(0)
  order: number;
}
