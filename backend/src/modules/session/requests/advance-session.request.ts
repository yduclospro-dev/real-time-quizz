import { IsOptional, IsInt, Min } from 'class-validator';

export class AdvanceSessionRequest {
  @IsOptional()
  @IsInt({ message: "L'index de la question suivante doit être un entier" })
  @Min(0, { message: "L'index de la question suivante doit être positif" })
  nextQuestionIndex?: number;

  @IsOptional()
  @IsInt({ message: 'Le temps limite doit être un entier' })
  @Min(1, { message: 'Le temps limite doit être supérieur à 0' })
  timeLimitSeconds?: number;
}
