import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { HealthController } from './health.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsBearerGuard } from './metrics-bearer.guard';

@Global()
@Module({
  controllers: [MetricsController, HealthController],
  providers: [
    MetricsService,
    MetricsBearerGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class CommonModule {}
