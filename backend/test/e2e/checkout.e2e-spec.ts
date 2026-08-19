import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

const CHECKOUT_PAYLOAD = {
  shippingName: 'Olena Kovalenko',
  shippingEmail: 'e2e-shopper@example.com',
  shippingAddress: 'Khreshchatyk St, 1',
  shippingCity: 'Kyiv',
  shippingPostal: '01001',
  cardNumber: '4242424242424242',
  cardExpiry: '12/29',
  cardCvc: '123',
};

describe('Checkout flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoryId: string;

  const uniqueEmail = (label: string) =>
    `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndLogin(): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail('shopper'), password: 'Password123!', name: 'Test Shopper' })
      .expect(201);
    return res.body.accessToken;
  }

  async function createProduct(name: string, stock: number) {
    return prisma.product.create({
      data: { name, description: 'e2e test product', price: 25, stock, categoryId },
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const category = await prisma.category.upsert({
      where: { slug: 'e2e-checkout' },
      update: {},
      create: { name: 'E2E Checkout', slug: 'e2e-checkout' },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('add to cart -> checkout -> stock decrements correctly', async () => {
    const token = await registerAndLogin();
    const product = await createProduct('E2E Single Stock Item', 1);

    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, qty: 1 })
      .expect(201);

    const checkoutRes = await request(app.getHttpServer())
      .post('/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send(CHECKOUT_PAYLOAD)
      .expect(201);

    expect(checkoutRes.body.status).toBe('NEW');
    expect(checkoutRes.body.items).toHaveLength(1);

    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updated.stock).toBe(0);

    const cart = await prisma.cartItem.findMany({ where: { userId: checkoutRes.body.userId } });
    expect(cart).toHaveLength(0);
  });

  it('rejects checkout with insufficient stock', async () => {
    const token = await registerAndLogin();
    const product = await createProduct('E2E Out Of Stock Item', 1);

    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, qty: 1 })
      .expect(201);

    // A second checkout can't happen through the API once cart is cleared, so drain stock directly
    // to simulate "someone else already bought it" between add-to-cart and checkout.
    await prisma.product.update({ where: { id: product.id }, data: { stock: 0 } });

    await request(app.getHttpServer())
      .post('/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send(CHECKOUT_PAYLOAD)
      .expect(409);
  });

  it('two concurrent checkouts for the last unit: exactly one succeeds, stock never goes negative', async () => {
    const [tokenA, tokenB] = await Promise.all([registerAndLogin(), registerAndLogin()]);
    const product = await createProduct('E2E Contended Last Unit', 1);

    await Promise.all([
      request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ productId: product.id, qty: 1 })
        .expect(201),
      request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ productId: product.id, qty: 1 })
        .expect(201),
    ]);

    const results = await Promise.allSettled([
      request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(CHECKOUT_PAYLOAD),
      request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${tokenB}`)
        .send(CHECKOUT_PAYLOAD),
    ]);

    const statuses = results.map((r) => (r.status === 'fulfilled' ? r.value.status : -1)).sort();
    expect(statuses).toEqual([201, 409]);

    const finalProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(finalProduct.stock).toBe(0);
  });
});
