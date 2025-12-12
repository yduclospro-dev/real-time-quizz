import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionRequest } from './create-quiz.request';

export class UpdateQuizRequest {
  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  title?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionRequest)
  questions?: CreateQuestionRequest[];
}
