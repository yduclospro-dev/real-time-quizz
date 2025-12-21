import { IsArray, IsString, ArrayNotEmpty, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerRequest {
  @ApiProperty({
    description: 'Question ID to submit answer for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({
    message: "L'identifiant de la question doit être une chaîne de caractères",
  })
  @IsNotEmpty({ message: "L'identifiant de la question ne peut pas être vide" })
  questionId!: string;

  @ApiProperty({
    description: 'Array of selected answer IDs',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray({ message: 'Les réponses sélectionnées doivent être un tableau' })
  @ArrayNotEmpty({
    message: 'Au moins une réponse doit être sélectionnée',
  })
  @IsString({
    each: true,
    message: 'Chaque answerId doit être une chaîne de caractères',
  })
  selectedAnswerIds!: string[];
}
