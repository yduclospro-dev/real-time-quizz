import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdvanceSessionRequest {
  @ApiProperty({
    description: 'Index of the next question to advance to',
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "L'index de la question suivante doit être un entier" })
  @Min(0, { message: "L'index de la question suivante doit être positif" })
  nextQuestionIndex?: number;

  @ApiProperty({
    description: 'Time limit for the next question in seconds',
    example: 30,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Le temps limite doit être un entier' })
  @Min(1, { message: 'Le temps limite doit être supérieur à 0' })
  timeLimitSeconds?: number;
}
