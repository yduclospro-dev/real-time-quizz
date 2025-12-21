import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@shared/enums/role';

export class RegisterRequest {
  @ApiProperty({ example: 'Dupont', description: 'User last name' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  lastName!: string;

  @ApiProperty({ example: 'Jean', description: 'User first name' })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  firstName!: string;

  @ApiProperty({ example: 'jean.dupont@example.com', description: 'User email address' })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @IsNotEmpty({ message: "L'adresse email est requise" })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)', minLength: 6 })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password!: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT, description: 'User role (TEACHER or STUDENT)' })
  @IsEnum(Role, { message: 'Le rôle doit être TEACHER ou STUDENT' })
  role!: Role;
}
