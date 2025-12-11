import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { RegisterRequest } from './requests/register.request';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(request: RegisterRequest): Promise<User> {
    const existingUser = await this.userService.findByEmail(request.email);
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hash = await bcrypt.hash(request.password, 10);

    const user = await this.userService.create({
      lastName: request.lastName,
      firstName: request.firstName,
      email: request.email,
      password: hash,
      role: request.role,
    });

    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');

    return user;
  }

  generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
