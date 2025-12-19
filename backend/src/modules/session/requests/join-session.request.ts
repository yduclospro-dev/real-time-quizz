import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinSessionRequest {
  @IsString({
    message: 'Le code de session doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'Le code de session est requis' })
  @Length(6, 6, {
    message: 'Le code de session doit contenir 6 caractères',
  })
  sessionCode!: string;
}
