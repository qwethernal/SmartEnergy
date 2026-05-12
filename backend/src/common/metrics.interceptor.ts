import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

function routePathFrom(req: Request): string {
  const routeUnknown: unknown = (req as { route?: unknown }).route;
  if (
    routeUnknown &&
    typeof routeUnknown === 'object' &&
    'path' in routeUnknown
  ) {
    const p = (routeUnknown as { path?: unknown }).path;
    if (typeof p === 'string' && p.length > 0) {
      return p;
    }
  }
  return req.path && req.path.length > 0 ? req.path : 'unknown';
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const started = process.hrtime.bigint();
    const method = req.method;
    const routePath = routePathFrom(req);

    return next.handle().pipe(
      finalize(() => {
        const seconds = Number(process.hrtime.bigint() - started) / 1e9;
        const status = res.statusCode || 500;
        const labels = {
          method,
          route: routePath,
          status_code: String(status),
        };
        this.metrics.httpRequestDuration.observe(labels, seconds);
        this.metrics.httpRequestTotal.inc(labels);
      }),
    );
  }
}
