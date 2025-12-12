import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterRequest } from './requests/register.request';
import { LoginRequest } from './requests/login.request';
import { ApiResponse } from '../../common/types/api-response';
import { UserDto } from '../../common/types/user-dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(
    @Body() request: RegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ user: UserDto }>> {
    const user = await this.authService.register(request);
    const token = this.authService.generateToken(user);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success('Inscription réussie', {
      user: UserDto.fromEntity(user),
    });
  }

  @Post('login')
  async login(
    @Body() request: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ user: UserDto }>> {
    const user = await this.authService.validateUser(
      request.email,
      request.password,
    );

    const token = this.authService.generateToken(user);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    return ApiResponse.success('Connexion réussie', {
      user: UserDto.fromEntity(user),
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(
    @CurrentUser() jwtPayload: JwtPayload,
  ): Promise<ApiResponse<UserDto>> {
    const user = await this.userService.findById(jwtPayload.sub);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return ApiResponse.success(
      'Utilisateur récupéré avec succès',
      UserDto.fromEntity(user as User),
    );
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): ApiResponse<null> {
    res.clearCookie('access_token');
    return ApiResponse.success('Déconnexion réussie');
  }
}
