import { ConflictException } from '@nestjs/common';
import { InventoryService } from '../../src/orders/inventory.service';
import type { Prisma } from '@prisma/client';

function makeTx(executeRaw: jest.Mock): Prisma.TransactionClient {
  return { $executeRaw: executeRaw } as unknown as Prisma.TransactionClient;
}

describe('InventoryService.decrementStock', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService();
  });

  it('decrements stock for every line when all have sufficient stock', async () => {
    const executeRaw = jest.fn().mockResolvedValue(1);
    const tx = makeTx(executeRaw);

    await expect(
      service.decrementStock(tx, [
        { productId: 'p1', qty: 2 },
        { productId: 'p2', qty: 1 },
      ]),
    ).resolves.toBeUndefined();

    expect(executeRaw).toHaveBeenCalledTimes(2);
  });

  it('throws ConflictException when a product has insufficient stock (0 rows affected)', async () => {
    const executeRaw = jest.fn().mockResolvedValue(0);
    const tx = makeTx(executeRaw);

    await expect(service.decrementStock(tx, [{ productId: 'p1', qty: 5 }])).rejects.toThrow(
      ConflictException,
    );
  });

  it('stops at the first insufficient-stock line without touching the rest', async () => {
    const executeRaw = jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const tx = makeTx(executeRaw);

    await expect(
      service.decrementStock(tx, [
        { productId: 'a', qty: 1 },
        { productId: 'b', qty: 1 },
      ]),
    ).rejects.toThrow(ConflictException);

    expect(executeRaw).toHaveBeenCalledTimes(1);
  });

  it('simulates two concurrent checkouts racing the last unit: exactly one succeeds', async () => {
    // Models Postgres's row-level semantics for `UPDATE ... WHERE stock >= qty`:
    // the conditional UPDATE is the source of truth, not a prior read.
    let stock = 1;
    const conditionalUpdate = jest.fn((_strings: TemplateStringsArray, ..._values: unknown[]) => {
      if (stock >= 1) {
        stock -= 1;
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    const tx = makeTx(conditionalUpdate as unknown as jest.Mock);

    const [first, second] = await Promise.allSettled([
      service.decrementStock(tx, [{ productId: 'last-unit', qty: 1 }]),
      service.decrementStock(tx, [{ productId: 'last-unit', qty: 1 }]),
    ]);

    const outcomes = [first.status, second.status].sort();
    expect(outcomes).toEqual(['fulfilled', 'rejected']);
    expect(stock).toBe(0);
  });

  it('restock adds quantity back without a stock-sufficiency check', async () => {
    const executeRaw = jest.fn().mockResolvedValue(1);
    const tx = makeTx(executeRaw);

    await service.restock(tx, [{ productId: 'p1', qty: 3 }]);
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });
});
