import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { SetActiveDto } from './dto/set-active.dto';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(UserRole.MASTER)
  list() {
    return this.users.listUsers();
  }

  @Post()
  @Roles(UserRole.MASTER)
  create(@Body() dto: CreateUserDto) {
    return this.users.createUser(dto);
  }

  @Patch('me/preferences')
  @Roles(UserRole.MASTER, UserRole.USER)
  updatePrefs(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.users.updateMyPreferences(req.user.sub, dto);
  }

  @Patch(':id/active')
  @Roles(UserRole.MASTER)
  setActive(@Param('id') id: string, @Body() body: SetActiveDto) {
    return this.users.setActive(id, body.active);
  }
}
