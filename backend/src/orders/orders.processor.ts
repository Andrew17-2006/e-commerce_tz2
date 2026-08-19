import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ORDERS_QUEUE, PROCESS_ORDER_JOB } from '../queue/constants';

/**
 * Post-checkout side effects only. Stock decrement + Order creation already happened
 * synchronously inside OrdersService.checkout — queuing that would allow overselling
 * while jobs wait. This worker simulates payment/processing latency and performs the
 * one automatic NEW -> PROCESSING transition, guarded so it can never clobber a status
 * an admin already changed (e.g. a manual CANCELLED) while the job was in flight.
 */
@Processor(ORDERS_QUEUE)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<void> {
    if (job.name !== PROCESS_ORDER_JOB) return;
    const { orderId } = job.data;

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const result = await this.prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.NEW },
      data: { status: OrderStatus.PROCESSING },
    });

    if (result.count > 0) {
      this.logger.log(`Order ${orderId} auto-transitioned NEW -> PROCESSING`);
    } else {
      this.logger.log(`Order ${orderId} skipped auto-transition (status already changed)`);
    }
  }
}
