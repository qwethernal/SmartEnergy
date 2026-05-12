import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

export type SpotBroadcast = {
  area: string;
  periodStart: string;
  priceEurMwh: number;
  stale?: boolean;
};

/** Same list as HTTP CORS (CORS_ORIGIN), not wildcard — avoids open WS from arbitrary sites. */
function websocketCorsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (list.length === 0) return 'http://localhost:5173';
  if (list.length === 1) {
    const [single] = list;
    return single;
  }
}

@WebSocketGateway({
  cors: { origin: websocketCorsOrigins(), credentials: true },
  transports: ['websocket', 'polling'],
})
export class PriceGateway implements OnGatewayInit {
  private readonly logger = new Logger(PriceGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server): void {
    void server;
    this.logger.log('WebSocket gateway ready');
  }

  emitSpot(payload: SpotBroadcast): void {
    this.server.emit('spot', payload);
  }
}
