import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceCommandDto } from './dto/device-command.dto';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  list(@Req() req: Request & { user: JwtPayload }) {
    return this.devices.listForUser(req.user.sub);
  }

  @Post()
  create(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateDeviceDto,
  ) {
    return this.devices.create(req.user.sub, dto);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.devices.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request & { user: JwtPayload }, @Param('id') id: string) {
    return this.devices.remove(req.user.sub, id);
  }

  @Post(':id/test-connection')
  test(@Req() req: Request & { user: JwtPayload }, @Param('id') id: string) {
    return this.devices.testConnection(req.user.sub, id);
  }

  @Post(':id/command')
  command(
    @Req() req: Request & { user: JwtPayload },
    @Param('id') id: string,
    @Body() dto: DeviceCommandDto,
  ) {
    return this.devices.sendCommand(req.user.sub, id, dto.state, 'MANUAL');
  }
}
