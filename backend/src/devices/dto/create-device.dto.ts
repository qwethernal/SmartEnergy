import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DeviceConnectionType } from '@prisma/client';

export class CreateDeviceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(DeviceConnectionType)
  connectionType!: DeviceConnectionType;

  @IsObject()
  connectionConfig!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @IsOptional()
  @IsNumber()
  thresholdEurMwh?: number | null;

  @IsOptional()
  @IsBoolean()
  automationEnabled?: boolean;
}
