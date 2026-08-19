import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from '../../src/orders/orders.service';
import { InventoryService } from '../../src/orders/inventory.service';
import { CacheService } from '../../src/redis/cache.service';
import { OrdersRepository } from '../../src/orders/orders.repository';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('OrdersService.checkout', () => {
  let ordersService: OrdersService;
  let prisma: {
    cartItem: { findMany: jest.Mock; deleteMany: jest.Mock };
    order: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let inventory: { decrementStock: jest.Mock; restock: jest.Mock };
  let cache: { bumpProductsVersion: jest.Mock; del: jest.Mock };
  let queue: { add: jest.Mock };

  const checkoutDto = {
    shippingName: 'Olena Kovalenko',
    shippingEmail: 'olena@example.com',
    shippingAddress: 'Khreshchatyk St, 1',
    shippingCity: 'Kyiv',
    shippingPostal: '01001',
    cardNumber: '4242424242424242',
    cardExpiry: '12/29',
    cardCvc: '123',
  };

  const cartRows = [
    { productId: 'p1', qty: 2, product: { id: 'p1', name: 'Headphones', price: 100 } },
    { productId: 'p2', qty: 1, product: { id: 'p2', name: 'Tote Bag', price: 42 } },
  ];

  beforeEach(() => {
    prisma = {
      cartItem: { findMany: jest.fn(), deleteMany: jest.fn() },
      order: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    inventory = { decrementStock: jest.fn().mockResolvedValue(undefined), restock: jest.fn() };
    cache = { bumpProductsVersion: jest.fn().mockResolvedValue(undefined), del: jest.fn().mockResolvedValue(undefined) };
    queue = { add: jest.fn().mockResolvedValue(undefined) };

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(prisma),
    );

    ordersService = new OrdersService(
      prisma as unknown as PrismaService,
      inventory as unknown as InventoryService,
      cache as unknown as CacheService,
      {} as OrdersRepository,
      queue as never,
    );
  });

  it('rejects checkout when the cart is empty', async () => {
    prisma.cartItem.findMany.mockResolvedValue([]);

    await expect(ordersService.checkout('user-1', checkoutDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(inventory.decrementStock).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('computes the total, snapshots line items, clears the cart, and enqueues processing', async () => {
    prisma.cartItem.findMany.mockResolvedValue(cartRows);
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.NEW,
      totalAmount: 242,
      items: [],
    });

    const order = await ordersService.checkout('user-1', checkoutDto);

    expect(inventory.decrementStock).toHaveBeenCalledWith(prisma, [
      { productId: 'p1', qty: 2 },
      { productId: 'p2', qty: 1 },
    ]);

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          status: OrderStatus.NEW,
          totalAmount: 242, // 2*100 + 1*42
          items: {
            create: [
              { productId: 'p1', productName: 'Headphones', unitPrice: 100, qty: 2 },
              { productId: 'p2', productName: 'Tote Bag', unitPrice: 42, qty: 1 },
            ],
          },
        }),
      }),
    );

    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', productId: { in: ['p1', 'p2'] } },
    });

    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith(
      'process-order',
      { orderId: 'order-1' },
      expect.objectContaining({ attempts: 3 }),
    );

    expect(order.id).toBe('order-1');

    expect(cache.bumpProductsVersion).toHaveBeenCalledTimes(1);
    expect(cache.del).toHaveBeenCalledWith('products:detail:p1');
    expect(cache.del).toHaveBeenCalledWith('products:detail:p2');
  });

  it('propagates insufficient-stock failures and never enqueues a job', async () => {
    prisma.cartItem.findMany.mockResolvedValue(cartRows);
    inventory.decrementStock.mockRejectedValue(new ConflictException('Insufficient stock'));

    await expect(ordersService.checkout('user-1', checkoutDto)).rejects.toThrow(ConflictException);
    expect(prisma.order.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });
});
