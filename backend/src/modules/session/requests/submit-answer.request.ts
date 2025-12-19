import { IsArray, IsString, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class SubmitAnswerRequest {
  @IsString({
    message: "L'identifiant de la question doit être une chaîne de caractères",
  })
  @IsNotEmpty({ message: "L'identifiant de la question ne peut pas être vide" })
  questionId!: string;

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
