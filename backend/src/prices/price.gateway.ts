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

@WebSocketGateway({
  cors: { origin: true },
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
