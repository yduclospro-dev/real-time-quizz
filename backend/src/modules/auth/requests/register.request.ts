import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterRequest {
  @IsString({ message: 'Le nom est requis' })
  lastName: string;

  @IsString({ message: 'Le prénom est requis' })
  firstName: string;

  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  email: string;

  @IsString({ message: 'Le mot de passe est requis' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password: string;

  @IsEnum(Role, { message: 'Le rôle doit être TEACHER ou STUDENT' })
  role: Role;
}
