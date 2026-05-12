import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry: client.Registry;
  readonly httpRequestDuration: client.Histogram<string>;
  readonly httpRequestTotal: client.Counter<string>;
  readonly deviceCommandsTotal: client.Counter<string>;
  readonly activeSessions: client.Gauge<string>;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.deviceCommandsTotal = new client.Counter({
      name: 'device_commands_total',
      help: 'Commands sent to devices',
      labelNames: ['result'],
      registers: [this.registry],
    });

    this.activeSessions = new client.Gauge({
      name: 'active_user_sessions',
      help: 'Active JWT sessions (approximation via issued tokens counter)',
      registers: [this.registry],
    });
  }

  async metricsText(): Promise<string> {
    return this.registry.metrics();
  }
}
