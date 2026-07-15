import { Controller, Get, Put, Delete, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    const { password, ...profile } = user;
    return profile;
  }

  @Put('me')
  async updateProfile(@CurrentUser('id') userId: string, @Body() data: Partial<User>) {
    delete data.password;
    delete data.email;
    delete data.isVerified;
    delete data.isActive;
    const user = await this.usersService.update(userId, data);
    const { password, ...profile } = user;
    return profile;
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser('id') userId: string) {
    await this.usersService.softDelete(userId);
  }
}
