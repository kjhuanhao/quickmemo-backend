import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from '../user/user.service';
import type { CreateUserDto, LoginDto } from '../../dtos/user.dto';
import { NoAuth } from '../../decorators/no-auth.decorator';
import { User } from '../../decorators/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('getVerifyCode')
  @NoAuth()
  async getVerifyCode(@Query('email') email: string): Promise<boolean> {
    await this.userService.sendVerifyCode(email);
    return true;
  }

  @Post('register')
  @NoAuth()
  async register(@Body() user: CreateUserDto): Promise<boolean> {
    await this.userService.createUser(user);
    return true;
  }

  @Get('getUserInfo')
  async getUserInfo(@User() user: UserDecoded) {
    return await this.userService.getUserInfo(user.id);
  }

  @Post('login')
  @NoAuth()
  async login(@Body() user: LoginDto, @Res() res: Response): Promise<boolean> {
    const { accessToken, refreshToken } = await this.userService.login(user);
    res.status(200).json({
      message: 'success',
      data: {
        accessToken,
        refreshToken,
      },
      code: 200,
    });
    return true;
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    res.send(200);
  }

  @Get('refresh')
  async refresh(@Query('token') token: string) {
    try {
      const { accessToken, refreshToken } =
        await this.userService.getRefreshToken(token);
      return {
        accessToken,
        refreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('用户信息失效，请重新登录');
    }
  }
}
