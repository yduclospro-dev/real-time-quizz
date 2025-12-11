import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequest {
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  email: string;

  @IsString({ message: 'Le mot de passe est requis' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password: string;
}
