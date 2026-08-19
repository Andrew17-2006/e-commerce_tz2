import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface StockLine {
  productId: string;
  qty: number;
}

/**
 * Isolated so the race-condition-safe decrement logic is independently unit-testable.
 * Correctness relies on Postgres's row-level write lock on the conditional UPDATE below:
 * two concurrent checkouts racing the last unit can only have one succeed, the other
 * sees `stock >= qty` evaluate false against the already-decremented row and gets 0
 * affected rows -> ConflictException -> the whole checkout transaction rolls back.
 */
@Injectable()
export class InventoryService {
  async decrementStock(tx: Prisma.TransactionClient, lines: StockLine[]): Promise<void> {
    const sorted = [...lines].sort((a, b) => a.productId.localeCompare(b.productId));
    for (const line of sorted) {
      const affected = await tx.$executeRaw`
        UPDATE "Product" SET stock = stock - ${line.qty}, "updatedAt" = now()
        WHERE id = ${line.productId} AND stock >= ${line.qty}
      `;
      if (affected === 0) {
        throw new ConflictException(`Недостатньо товару на складі (id: ${line.productId})`);
      }
    }
  }

  async restock(tx: Prisma.TransactionClient, lines: StockLine[]): Promise<void> {
    for (const line of lines) {
      await tx.$executeRaw`
        UPDATE "Product" SET stock = stock + ${line.qty}, "updatedAt" = now()
        WHERE id = ${line.productId}
      `;
    }
  }
}
