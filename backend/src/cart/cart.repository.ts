import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CART_ITEM_INCLUDE = { product: { include: { category: true } } } as const;

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: CART_ITEM_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  findProduct(productId: string) {
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  findItem(userId: string, productId: string) {
    return this.prisma.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
  }

  upsertItem(userId: string, productId: string, qty: number) {
    return this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { qty },
      create: { userId, productId, qty },
      include: CART_ITEM_INCLUDE,
    });
  }

  updateItem(userId: string, productId: string, qty: number) {
    return this.prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { qty },
      include: CART_ITEM_INCLUDE,
    });
  }

  deleteItem(userId: string, productId: string) {
    return this.prisma.cartItem.delete({ where: { userId_productId: { userId, productId } } });
  }

  clear(userId: string) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
