import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';
import { IsInt, Min, Max } from 'class-validator';

export class CreateAnswerRequest {
  @IsString({
    message: 'Le texte de la réponse doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'Le texte de la réponse est requis' })
  text!: string;

  @IsBoolean({ message: 'isCorrect doit être un booléen' })
  @IsNotEmpty({ message: 'isCorrect est requis' })
  isCorrect!: boolean;
}

export class CreateQuestionRequest {
  @IsString({
    message: 'Le texte de la question doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'Le texte de la question est requis' })
  text!: string;

  @IsEnum(QuestionType, {
    message:
      'Le type de la question doit être SINGLE_CHOICE ou MULTIPLE_CHOICE',
  })
  type!: QuestionType;

  @IsOptional()
  @IsString({ message: "L'URL de l'image doit être une chaîne de caractères" })
  image?: string;

  @IsArray({ message: 'Les réponses doivent être un tableau' })
  @ArrayMinSize(2, { message: 'Au moins deux réponses sont requises' })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerRequest)
  answers!: CreateAnswerRequest[];

  @IsOptional()
  @IsInt({ message: 'timeLimit doit être un entier (secondes)' })
  @Min(5, { message: 'Le timeLimit minimal est de 5 secondes' })
  @Max(3600, { message: 'Le timeLimit maximal est de 3600 secondes' })
  timeLimit?: number;
}

export class CreateQuizRequest {
  @IsString({ message: 'Le titre du quiz doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre du quiz est requis' })
  title!: string;

  @IsArray({ message: 'Les questions doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Le quiz doit contenir au moins une question' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionRequest)
  questions!: CreateQuestionRequest[];
}
