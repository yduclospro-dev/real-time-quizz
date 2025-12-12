import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from './requests/register.request';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { UserDto, userToDto } from '../../common/types/user-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(request: RegisterRequest): Promise<UserDto> {
    const existingUser = await this.userService.findByEmail(request.email);
    if (existingUser) {
      throw new ApiException(
        409,
        ErrorCode.UNIQUE_CONSTRAINT,
        'Cet email est déjà utilisé',
      );
    }

    const hash = await bcrypt.hash(request.password, 10);

    const user = await this.userService.create({
      lastName: request.lastName,
      firstName: request.firstName,
      email: request.email,
      password: hash,
      role: request.role,
    });

    return userToDto(user);
  }

  async validateUser(email: string, password: string): Promise<UserDto> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new ApiException(
        401,
        ErrorCode.INVALID_CREDENTIALS,
        "L'email ou le mot de passe est invalide",
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new ApiException(
        401,
        ErrorCode.INVALID_CREDENTIALS,
        "L'email ou le mot de passe est invalide",
      );
    }

    return userToDto(user);
  }

  generateToken(user: UserDto): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
