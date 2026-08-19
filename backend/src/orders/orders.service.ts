import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { InventoryService } from './inventory.service';
import { OrdersRepository } from './orders.repository';
import { CheckoutDto } from './dto/checkout.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { ORDERS_QUEUE, PROCESS_ORDER_JOB } from '../queue/constants';

const FINAL_STATUSES: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];

const STATUS_LABELS_UK: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'нове',
  [OrderStatus.PROCESSING]: 'в обробці',
  [OrderStatus.SHIPPED]: 'відправлене',
  [OrderStatus.COMPLETED]: 'завершене',
  [OrderStatus.CANCELLED]: 'скасоване',
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly cache: CacheService,
    private readonly repository: OrdersRepository,
    @InjectQueue(ORDERS_QUEUE) private readonly ordersQueue: Queue,
  ) {}

  /** Stock changed for these products — bust the list cache and their detail cache so availability shown to users is never stale. */
  private async invalidateProductsCache(productIds: string[]): Promise<void> {
    await this.cache.bumpProductsVersion();
    await Promise.all(productIds.map((id) => this.cache.del(`products:detail:${id}`)));
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    if (cartItems.length === 0) {
      throw new BadRequestException('Ваш кошик порожній');
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.qty,
      0,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      await this.inventory.decrementStock(
        tx,
        cartItems.map((item) => ({ productId: item.productId, qty: item.qty })),
      );

      const created = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.NEW,
          totalAmount,
          shippingName: dto.shippingName,
          shippingEmail: dto.shippingEmail,
          shippingPhone: dto.shippingPhone,
          shippingAddress: dto.shippingAddress,
          shippingCity: dto.shippingCity,
          shippingPostal: dto.shippingPostal,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              unitPrice: item.product.price,
              qty: item.qty,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({
        where: { userId, productId: { in: cartItems.map((item) => item.productId) } },
      });

      return created;
    });

    this.logger.log(`Order ${order.id} created for user ${userId} (total $${order.totalAmount})`);

    await this.invalidateProductsCache(cartItems.map((item) => item.productId));

    await this.ordersQueue.add(
      PROCESS_ORDER_JOB,
      { orderId: order.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return order;
  }

  findAllForUser(userId: string) {
    return this.repository.findAllForUser(userId);
  }

  async findAllAdmin(query: QueryOrdersDto) {
    const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {};
    const skip = (query.page - 1) * query.limit;

    const { items, total } = await this.repository.findAllAdmin(where, skip, query.limit);

    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string, requester: { userId: string; role: Role }) {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException('Замовлення не знайдено');
    if (requester.role !== Role.ADMIN && order.userId !== requester.userId) {
      throw new ForbiddenException('У вас немає доступу до цього замовлення');
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException('Замовлення не знайдено');

    if (FINAL_STATUSES.includes(order.status)) {
      throw new ConflictException(
        `Замовлення вже ${STATUS_LABELS_UK[order.status]} — статус більше не можна змінити`,
      );
    }

    if (status === OrderStatus.CANCELLED) {
      const cancelled = await this.prisma.$transaction(async (tx) => {
        await this.inventory.restock(
          tx,
          order.items.map((item) => ({ productId: item.productId, qty: item.qty })),
        );
        return tx.order.update({
          where: { id },
          data: { status: OrderStatus.CANCELLED },
          include: { items: true },
        });
      });
      this.logger.log(`Order ${id} cancelled, stock restored`);
      await this.invalidateProductsCache(order.items.map((item) => item.productId));
      return cancelled;
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    this.logger.log(`Order ${id} status changed to ${status}`);
    return updated;
  }
}
