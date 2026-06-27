import { IsString, IsOptional } from 'class-validator';

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  name?: string;
}
