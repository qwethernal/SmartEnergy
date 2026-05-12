import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { fetchEleringNpsDay } from './elering.client';
import { PriceGateway } from './price.gateway';

@Injectable()
export class PricesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PricesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gateway: PriceGateway,
  ) {}

  onApplicationBootstrap(): void {
    void this.refreshRecentDays();
  }

  @Cron('*/10 * * * *')
  async scheduledRefresh(): Promise<void> {
    await this.refreshRecentDays();
  }

  async refreshRecentDays(): Promise<{ imported: number; warning?: string }> {
    const baseUrl = this.config.get<string>(
      'ELERING_NPS_BASE_URL',
      'https://dashboard.elering.ee',
    );
    const timeoutMs = Number(
      this.config.get('ELERING_HTTP_TIMEOUT_MS') ?? 8000,
    );
    const dates = this.recentDateKeys(2);
    let imported = 0;
    let warning: string | undefined;
    for (const date of dates) {
      try {
        const points = await fetchEleringNpsDay({ date, baseUrl, timeoutMs });
        for (const p of points) {
          await this.prisma.spotPrice.upsert({
            where: {
              area_periodStart: { area: 'EE', periodStart: p.periodStart },
            },
            create: {
              area: 'EE',
              periodStart: p.periodStart,
              priceEurMwh: p.priceEurMwh,
            },
            update: {
              priceEurMwh: p.priceEurMwh,
              fetchedAt: new Date(),
            },
          });
          imported += 1;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error({ date, msg }, 'elering_fetch_failed');
        warning = `Elering API unavailable for ${date}: ${msg}`;
      }
    }
    const latest = await this.getLatestFromDb();
    if (latest) {
      this.gateway.emitSpot({
        area: latest.area,
        periodStart: latest.periodStart.toISOString(),
        priceEurMwh: Number(latest.priceEurMwh),
        stale: Boolean(warning),
      });
    }
    return { imported, warning };
  }

  async getLatestFromDb() {
    return this.prisma.spotPrice.findFirst({
      where: { area: 'EE' },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getCurrentSlot() {
    const latest = await this.getLatestFromDb();
    if (!latest) {
      return {
        priceEurMwh: null as number | null,
        periodStart: null as string | null,
        stale: true,
        warning: 'No cached spot prices yet',
      };
    }
    const ageMs = Date.now() - latest.fetchedAt.getTime();
    const stale = ageMs > 2 * 60 * 60 * 1000;
    return {
      priceEurMwh: Number(latest.priceEurMwh),
      periodStart: latest.periodStart.toISOString(),
      stale,
      warning: stale
        ? 'Using last known price; upstream feed is older than 2 hours'
        : undefined,
    };
  }

  async forecast24h() {
    const now = new Date();
    const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const rows = await this.prisma.spotPrice.findMany({
      where: { area: 'EE', periodStart: { gte: now, lte: until } },
      orderBy: { periodStart: 'asc' },
    });
    return rows.map((r: (typeof rows)[number]) => ({
      periodStart: r.periodStart.toISOString(),
      priceEurMwh: Number(r.priceEurMwh),
    }));
  }

  private recentDateKeys(days: number): string[] {
    const out: string[] = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
}
