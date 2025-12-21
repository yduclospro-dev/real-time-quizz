import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateQuestionRequest } from './create-quiz.request';

export class UpdateQuizRequest {
  @ApiProperty({
    description: 'Updated quiz title',
    example: 'Updated Geography Quiz',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  title?: string;

  @ApiProperty({
    description: 'Updated list of questions',
    type: [CreateQuestionRequest],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionRequest)
  questions?: CreateQuestionRequest[];
}
