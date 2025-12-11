import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterRequest } from './requests/register.request';
import { ApiResponse } from '../../common/types/api-response';
import { UserDto } from '../../common/types/user-dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(
    @Body() request: RegisterRequest,
  ): Promise<ApiResponse<{ user: UserDto; access_token: string }>> {
    const user = await this.authService.register(request);
    const token = this.authService.generateToken(user);

    return ApiResponse.success('Inscription réussie', {
      user: UserDto.fromEntity(user),
      access_token: token,
    });
  }

  // @Post('login')
  // async login(
  //   @Body() request: LoginRequest,
  // ): Promise<ApiResponse<{ user: UserResponseDto; access_token: string }>> {
  //   const user = await this.authService.validateUser(
  //     request.email,
  //     request.password,
  //   );
  //   if (!user) {
  //     throw new Error('Utilisateur non trouvé');
  //   }
  //   const token = this.authService.generateToken(user);
  //   return ApiResponse.success('Connexion réussie', {
  //     user: UserResponseDto.fromPrisma(user),
  //     access_token: token,
  //   });
  // }

  // @UseGuards(AuthGuard('jwt'))
  // @Get('me')
  // async me(@Req() req: AuthenticatedRequest): Promise<ApiResponse<UserResponseDto>> {
  //   const user = await this.userService.findById(req.user.id);
  //   if (!user) {
  //     throw new Error('Utilisateur non trouvé');
  //   }
  //   return ApiResponse.success('Utilisateur récupéré avec succès', UserResponseDto.fromPrisma(user));
  // }
}
