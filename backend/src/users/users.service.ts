import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = dto.role === UserRole.MASTER ? UserRole.MASTER : UserRole.USER;
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
        preferences: { create: {} },
      },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async setActive(userId: string, active: boolean) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { active },
        select: { id: true, email: true, active: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async updateMyPreferences(userId: string, dto: UpdatePreferencesDto) {
    const data: Prisma.UserPreferencesUpdateInput = {};
    if (dto.fixedTariffEurKwh !== undefined) {
      data.fixedTariffEurKwh = dto.fixedTariffEurKwh;
    }
    if (dto.vacationMode !== undefined) {
      data.vacationMode = dto.vacationMode;
    }
    if (dto.telegramChatId !== undefined) {
      data.telegramChatId = dto.telegramChatId;
    }
    if (dto.discordWebhookUrl !== undefined) {
      data.discordWebhookUrl = dto.discordWebhookUrl;
    }
    return this.prisma.userPreferences.update({
      where: { userId },
      data,
    });
  }
}
