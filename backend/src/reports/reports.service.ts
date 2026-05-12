import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { savingsVsFixedTariff } from './savings.vs-fixed';
import { SavingsQueryDto } from './dto/savings-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async savingsForUser(userId: string, query: SavingsQueryDto) {
    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    if (!prefs) {
      throw new BadRequestException('Preferences missing');
    }
    const fixedTariffEurPerKwh = Number(prefs.fixedTariffEurKwh);
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid from/to');
    }
    const spots = await this.prisma.spotPrice.findMany({
      where: { area: 'EE', periodStart: { gte: from, lte: to } },
      orderBy: { periodStart: 'asc' },
    });
    if (!spots.length) {
      return {
        window: { from: from.toISOString(), to: to.toISOString() },
        warning:
          'No spot rows in range; import prices first (POST /api/prices/refresh).',
        detail: [],
      };
    }
    const sumEurMwh = spots.reduce((a, s) => a + Number(s.priceEurMwh), 0);
    const avgEurMwh = sumEurMwh / spots.length;
    const averageSpotEurPerKwh = avgEurMwh / 1000;
    const energyKwh = query.energyKwh ?? 100;
    const calc = savingsVsFixedTariff({
      energyKwh,
      averageSpotEurPerKwh,
      fixedTariffEurPerKwh,
    });
    return {
      algorithm:
        'averageSpotEurPerKwh = mean(priceEurMwh)/1000 over hourly EE rows in window; costs = energyKwh * tariff; savings = fixedCost - spotCost.',
      window: { from: from.toISOString(), to: to.toISOString() },
      hourlyPoints: spots.length,
      averageSpotEurMwh: Math.round(avgEurMwh * 100) / 100,
      ...calc,
    };
  }
}
