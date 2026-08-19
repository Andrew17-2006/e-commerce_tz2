import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRangeDto } from './dto/analytics-range.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { SalesByDayQueryDto } from './dto/sales-by-day-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  summary(@Query() range: AnalyticsRangeDto) {
    return this.analyticsService.summary(range);
  }

  @Get('top-products')
  topProducts(@Query() query: TopProductsQueryDto) {
    return this.analyticsService.topProducts(query, query.limit);
  }

  @Get('sales-by-day')
  salesByDay(@Query() query: SalesByDayQueryDto) {
    return this.analyticsService.salesByDay(query.days);
  }

  @Get('export.csv')
  async exportCsv(@Query() range: AnalyticsRangeDto, @Res() res: Response) {
    const csv = await this.analyticsService.exportCsv(range);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('sales-report.csv');
    res.send(csv);
  }
}
