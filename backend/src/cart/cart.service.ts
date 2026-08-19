import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from './cart.repository';

@Injectable()
export class CartService {
  constructor(private readonly repository: CartRepository) {}

  getCart(userId: string) {
    return this.repository.findByUser(userId);
  }

  async addItem(userId: string, productId: string, qty: number) {
    const product = await this.repository.findProduct(productId);
    if (!product) throw new NotFoundException('Товар не знайдено');

    const existing = await this.repository.findItem(userId, productId);
    const desiredQty = (existing?.qty ?? 0) + qty;
    if (desiredQty > product.stock) {
      throw new BadRequestException(`Доступно лише ${product.stock} шт. товару «${product.name}»`);
    }

    return this.repository.upsertItem(userId, productId, desiredQty);
  }

  async updateItem(userId: string, productId: string, qty: number) {
    const product = await this.repository.findProduct(productId);
    if (!product) throw new NotFoundException('Товар не знайдено');
    if (qty > product.stock) {
      throw new BadRequestException(`Доступно лише ${product.stock} шт. товару «${product.name}»`);
    }

    try {
      return await this.repository.updateItem(userId, productId, qty);
    } catch {
      throw new NotFoundException('Товару немає в кошику');
    }
  }

  async removeItem(userId: string, productId: string) {
    try {
      await this.repository.deleteItem(userId, productId);
    } catch {
      throw new NotFoundException('Товару немає в кошику');
    }
  }

  async clear(userId: string) {
    await this.repository.clear(userId);
  }
}
