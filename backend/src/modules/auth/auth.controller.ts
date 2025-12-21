import { Controller, Post, Body, Get, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseDec, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterRequest } from './requests/register.request';
import { LoginRequest } from './requests/login.request';
import type { ApiResponse } from '../../common/types/api-response';
import type { UserDto } from '../../common/types/user-dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { successResponse } from '../../common/http/api-response.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user', description: 'Creates a new user account and returns JWT token in httpOnly cookie' })
  @ApiBody({ type: RegisterRequest })
  @ApiResponseDec({ status: 201, description: 'User successfully registered' })
  @ApiResponseDec({ status: 400, description: 'Validation error or email already exists' })
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

    return successResponse({ user });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user', description: 'Authenticates user and returns JWT token in httpOnly cookie' })
  @ApiBody({ type: LoginRequest })
  @ApiResponseDec({ status: 200, description: 'User successfully logged in' })
  @ApiResponseDec({ status: 401, description: 'Invalid credentials' })
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse({ user });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user', description: 'Returns the currently authenticated user information' })
  @ApiResponseDec({ status: 200, description: 'Current user data' })
  @ApiResponseDec({ status: 401, description: 'Not authenticated' })
  async me(
    @CurrentUser() jwtPayload: JwtPayload,
  ): Promise<ApiResponse<UserDto>> {
    const user = await this.userService.findByIdOrFail(jwtPayload.sub);
    return successResponse(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user', description: 'Clears the JWT token cookie' })
  @ApiResponseDec({ status: 200, description: 'Successfully logged out' })
  logout(@Res({ passthrough: true }) res: Response): ApiResponse<null> {
    res.clearCookie('access_token');
    return successResponse(null);
  }
}
