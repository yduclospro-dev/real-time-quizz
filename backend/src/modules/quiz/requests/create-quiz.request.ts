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
import { QuestionType } from '@shared/enums/question-type';
import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerRequest {
  @ApiProperty({
    description: 'Answer text',
    example: 'Paris',
  })
  @IsString({
    message: 'Le texte de la réponse doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'Le texte de la réponse est requis' })
  text!: string;

  @ApiProperty({
    description: 'Whether this answer is correct',
    example: true,
  })
  @IsBoolean({ message: 'isCorrect doit être un booléen' })
  @IsNotEmpty({ message: 'isCorrect est requis' })
  isCorrect!: boolean;
}

export class CreateQuestionRequest {
  @ApiProperty({
    description: 'Question text',
    example: 'What is the capital of France?',
  })
  @IsString({
    message: 'Le texte de la question doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'Le texte de la question est requis' })
  text!: string;

  @ApiProperty({
    description: 'Question type',
    enum: QuestionType,
    example: QuestionType.SINGLE_CHOICE,
  })
  @IsEnum(QuestionType, {
    message:
      'Le type de la question doit être SINGLE_CHOICE ou MULTIPLE_CHOICE',
  })
  type!: QuestionType;

  @ApiProperty({
    description: 'Optional image URL for the question',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "L'URL de l'image doit être une chaîne de caractères" })
  image?: string;

  @ApiProperty({
    description: 'List of possible answers (minimum 2)',
    type: [CreateAnswerRequest],
    example: [{ text: 'Paris', isCorrect: true }, { text: 'London', isCorrect: false }],
  })
  @IsArray({ message: 'Les réponses doivent être un tableau' })
  @ArrayMinSize(2, { message: 'Au moins deux réponses sont requises' })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerRequest)
  answers!: CreateAnswerRequest[];

  @ApiProperty({
    description: 'Time limit for this question in seconds (5-3600)',
    example: 30,
    minimum: 5,
    maximum: 3600,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'timeLimit doit être un entier (secondes)' })
  @Min(5, { message: 'Le timeLimit minimal est de 5 secondes' })
  @Max(3600, { message: 'Le timeLimit maximal est de 3600 secondes' })
  timeLimit?: number;
}

export class CreateQuizRequest {
  @ApiProperty({
    description: 'Quiz title',
    example: 'Geography Quiz',
  })
  @IsString({ message: 'Le titre du quiz doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre du quiz est requis' })
  title!: string;

  @ApiProperty({
    description: 'List of questions (minimum 1)',
    type: [CreateQuestionRequest],
  })
  @IsArray({ message: 'Les questions doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Le quiz doit contenir au moins une question' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionRequest)
  questions!: CreateQuestionRequest[];
}
