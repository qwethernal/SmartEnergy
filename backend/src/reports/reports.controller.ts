import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { SavingsQueryDto } from './dto/savings-query.dto';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('savings')
  savings(
    @Req() req: Request & { user: JwtPayload },
    @Query() query: SavingsQueryDto,
  ) {
    return this.reports.savingsForUser(req.user.sub, query);
  }
}
