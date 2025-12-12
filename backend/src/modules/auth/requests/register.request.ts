import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { Role } from '../../../../../shared/enums/role';

export class RegisterRequest {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  lastName!: string;

  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  firstName!: string;

  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @IsNotEmpty({ message: "L'adresse email est requise" })
  email!: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password!: string;

  @IsEnum(Role, { message: 'Le rôle doit être TEACHER ou STUDENT' })
  role!: Role;
}
