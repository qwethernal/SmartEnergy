import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DeviceConnectionType, PowerState, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../common/metrics.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  listForUser(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOwned(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async create(userId: string, dto: CreateDeviceDto) {
    await this.assertDb();
    return this.prisma.device.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? '',
        connectionType: dto.connectionType,
        connectionConfig: dto.connectionConfig as Prisma.InputJsonValue,
        isCritical: dto.isCritical ?? false,
        thresholdEurMwh:
          dto.thresholdEurMwh === undefined || dto.thresholdEurMwh === null
            ? undefined
            : dto.thresholdEurMwh,
        automationEnabled: dto.automationEnabled ?? true,
      },
    });
  }

  async update(userId: string, deviceId: string, dto: UpdateDeviceDto) {
    await this.getOwned(userId, deviceId);
    const data: Prisma.DeviceUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.connectionType !== undefined)
      data.connectionType = dto.connectionType;
    if (dto.connectionConfig !== undefined) {
      data.connectionConfig = dto.connectionConfig as Prisma.InputJsonValue;
    }
    if (dto.isCritical !== undefined) data.isCritical = dto.isCritical;
    if (dto.thresholdEurMwh !== undefined) {
      data.thresholdEurMwh = dto.thresholdEurMwh;
    }
    if (dto.automationEnabled !== undefined) {
      data.automationEnabled = dto.automationEnabled;
    }
    if (dto.manualOverride !== undefined)
      data.manualOverride = dto.manualOverride;
    return this.prisma.device.update({
      where: { id: deviceId },
      data,
    });
  }

  async remove(userId: string, deviceId: string) {
    await this.getOwned(userId, deviceId);
    await this.prisma.device.delete({ where: { id: deviceId } });
    return { ok: true };
  }

  async testConnection(userId: string, deviceId: string) {
    const device = await this.getOwned(userId, deviceId);
    try {
      if (device.connectionType === DeviceConnectionType.HTTP) {
        const cfg = device.connectionConfig as {
          url?: string;
          method?: string;
        };
        if (!cfg?.url || typeof cfg.url !== 'string') {
          return {
            ok: false,
            message: 'HTTP device requires connectionConfig.url',
          };
        }
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(cfg.url, {
          method: cfg.method || 'GET',
          signal: controller.signal,
        });
        clearTimeout(t);
        return { ok: res.ok, status: res.status };
      }
      if (device.connectionType === DeviceConnectionType.MQTT) {
        return { ok: true, message: 'MQTT probe not implemented (mock OK)' };
      }
      return { ok: true, message: 'IP_PING probe not implemented (mock OK)' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.warn({ deviceId, msg }, 'device_connection_test_failed');
      return { ok: false, message: msg };
    }
  }

  async sendCommand(
    userId: string,
    deviceId: string,
    state: 'ON' | 'OFF',
    source: string,
  ) {
    await this.assertDb();
    const device = await this.getOwned(userId, deviceId);
    const next: PowerState = state === 'ON' ? PowerState.ON : PowerState.OFF;

    let success = true;
    let message: string | null = null;
    try {
      if (device.connectionType === DeviceConnectionType.HTTP) {
        const result = await this.invokeHttpSwitch(device, state);
        success = result.success;
        message = result.message;
      } else {
        message = 'Simulated command (no physical integration)';
      }
    } catch (e) {
      success = false;
      message = e instanceof Error ? e.message : 'error';
      this.logger.error({ deviceId, err: message }, 'device_command_failed');
    }

    await this.prisma.deviceCommandLog.create({
      data: {
        deviceId: device.id,
        command: state,
        source,
        success,
        message,
      },
    });
    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        lastState: success ? next : device.lastState,
        lastPolledAt: new Date(),
      },
    });
    this.metrics.deviceCommandsTotal.inc({ result: success ? 'ok' : 'fail' });
    this.logger.log({ deviceId, state, source, success }, 'device_command');
    return { success, message };
  }

  private async invokeHttpSwitch(
    device: { connectionConfig: Prisma.JsonValue },
    state: 'ON' | 'OFF',
  ): Promise<{ success: boolean; message: string | null }> {
    const cfg = device.connectionConfig as {
      onUrl?: string;
      offUrl?: string;
      url?: string;
      method?: string;
    };
    const url =
      state === 'ON' ? (cfg.onUrl ?? cfg.url) : (cfg.offUrl ?? cfg.url);
    if (!url) {
      return {
        success: false,
        message: 'Missing onUrl/offUrl/url in connectionConfig',
      };
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: cfg.method || 'GET',
      signal: controller.signal,
    });
    clearTimeout(t);
    return { success: res.ok, message: `HTTP ${res.status}` };
  }

  private async assertDb(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      this.logger.error({ err: String(e) }, 'database_unavailable');
      throw new ServiceUnavailableException(
        'Database unavailable; refusing to send device commands.',
      );
    }
  }
}
