import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinSessionRequest {
  @ApiProperty({
    description: 'Session code to join (6 characters)',
    example: 'ABC123',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({
    message: 'Le code de session doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'Le code de session est requis' })
  @Length(6, 6, {
    message: 'Le code de session doit contenir 6 caractères',
  })
  sessionCode!: string;
}
