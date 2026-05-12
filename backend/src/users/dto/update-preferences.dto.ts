import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePreferencesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  fixedTariffEurKwh?: number;

  @IsOptional()
  @IsBoolean()
  vacationMode?: boolean;

  @IsOptional()
  @IsString()
  telegramChatId?: string | null;

  @IsOptional()
  @IsString()
  discordWebhookUrl?: string | null;
}
