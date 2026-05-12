import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { PriceGateway } from './price.gateway';

@Module({
  imports: [AuthModule],
  controllers: [PricesController],
  providers: [PricesService, PriceGateway],
  exports: [PricesService, PriceGateway],
})
export class PricesModule {}
