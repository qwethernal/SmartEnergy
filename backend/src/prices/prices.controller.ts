import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PricesService } from './prices.service';

@Controller('prices')
@UseGuards(JwtAuthGuard)
export class PricesController {
  constructor(private readonly prices: PricesService) {}

  @Get('latest')
  latest() {
    return this.prices.getCurrentSlot();
  }

  @Get('forecast-24h')
  forecast() {
    return this.prices.forecast24h();
  }

  @Post('refresh')
  refresh() {
    return this.prices.refreshRecentDays();
  }
}
