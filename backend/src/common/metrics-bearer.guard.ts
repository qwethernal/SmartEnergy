import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * If METRICS_BEARER_TOKEN is set, GET /metrics requires Authorization: Bearer <token>.
 * If unset, metrics stay open (typical for Prometheus on a private network).
 */
@Injectable()
export class MetricsBearerGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('METRICS_BEARER_TOKEN');
    if (!expected || expected.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${expected}`) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
