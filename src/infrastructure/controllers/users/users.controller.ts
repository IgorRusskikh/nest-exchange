import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from 'src/infrastructure/services/users/users.service';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/me')
  async getProfile(@Req() request: Request) {
    return {
      message: 'Профиль пользователя доступен только с валидным токеном',
      user: request.user,
    };
  }
}
