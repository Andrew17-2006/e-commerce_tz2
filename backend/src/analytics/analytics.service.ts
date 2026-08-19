import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsRangeDto } from './dto/analytics-range.dto';

const NON_REVENUE_STATUSES: OrderStatus[] = [OrderStatus.CANCELLED];

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private dateFilter(range: AnalyticsRangeDto): Prisma.DateTimeFilter | undefined {
    if (!range.from && !range.to) return undefined;
    return {
      ...(range.from ? { gte: new Date(range.from) } : {}),
      ...(range.to ? { lte: new Date(range.to) } : {}),
    };
  }

  async summary(range: AnalyticsRangeDto) {
    const createdAt = this.dateFilter(range);
    const where: Prisma.OrderWhereInput = {
      status: { notIn: NON_REVENUE_STATUSES },
      ...(createdAt ? { createdAt } : {}),
    };

    const [aggregate, orderCount] = await Promise.all([
      this.prisma.order.aggregate({ where, _sum: { totalAmount: true } }),
      this.prisma.order.count({ where }),
    ]);

    return {
      totalRevenue: Number(aggregate._sum.totalAmount ?? 0),
      orderCount,
    };
  }

  async topProducts(range: AnalyticsRangeDto, limit: number) {
    const createdAt = this.dateFilter(range);
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: {
          status: { notIn: NON_REVENUE_STATUSES },
          ...(createdAt ? { createdAt } : {}),
        },
      },
      _sum: { qty: true, unitPrice: true },
    });

    const withRevenue = await Promise.all(
      grouped.map(async (g) => {
        const items = await this.prisma.orderItem.findMany({
          where: {
            productId: g.productId,
            order: {
              status: { notIn: NON_REVENUE_STATUSES },
              ...(createdAt ? { createdAt } : {}),
            },
          },
          select: { qty: true, unitPrice: true },
        });
        const sold = items.reduce((sum, i) => sum + i.qty, 0);
        const revenue = items.reduce((sum, i) => sum + i.qty * Number(i.unitPrice), 0);
        return { productId: g.productId, name: g.productName, sold, revenue };
      }),
    );

    return withRevenue.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }

  async salesByDay(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { status: { notIn: NON_REVENUE_STATUSES }, createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true },
    });

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (bucket) {
        bucket.revenue += Number(order.totalAmount);
        bucket.orders += 1;
      }
    }

    return Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));
  }

  async exportCsv(range: AnalyticsRangeDto): Promise<string> {
    const createdAt = this.dateFilter(range);
    const orders = await this.prisma.order.findMany({
      where: { ...(createdAt ? { createdAt } : {}) },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const header = [
      'Order ID',
      'Date',
      'Status',
      'Customer',
      'Product',
      'Qty',
      'Unit Price',
      'Line Total',
      'Order Total',
    ];
    const rows = orders.flatMap((order) => {
      const date = order.createdAt.toISOString().replace('T', ' ').slice(0, 19);
      return order.items.map((item) =>
        [
          order.id,
          date,
          order.status,
          order.shippingName,
          item.productName,
          item.qty,
          Number(item.unitPrice).toFixed(2),
          (item.qty * Number(item.unitPrice)).toFixed(2),
          Number(order.totalAmount).toFixed(2),
        ]
          .map(csvEscape)
          .join(','),
      );
    });

    const BOM = '﻿';
    return BOM + [header.join(','), ...rows].join('\r\n');
  }
}
