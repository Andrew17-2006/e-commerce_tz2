import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' },
  { name: 'Home', slug: 'home', description: 'Furnishings and décor' },
  { name: 'Kitchen', slug: 'kitchen', description: 'Cooking and dining' },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, wallets, and more' },
  { name: 'Sports', slug: 'sports', description: 'Fitness and outdoor gear' },
];

const PRODUCTS: Array<{
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  description: string;
}> = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    category: 'Electronics',
    price: 299,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format',
    description:
      'Premium over-ear headphones with 30-hour battery life and adaptive noise cancellation. Studio-grade sound meets all-day comfort with memory foam ear cushions.',
  },
  {
    name: 'Linen Cushion Cover Set',
    category: 'Home',
    price: 45,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop&auto=format',
    description: 'Set of 4 handwoven linen cushion covers in muted earth tones. Natural texture, machine washable, 45×45 cm.',
  },
  {
    name: 'Ceramic Pour-Over Set',
    category: 'Kitchen',
    price: 78,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&auto=format',
    description: 'Handcrafted ceramic pour-over dripper with matching server and two mugs. Designed for the intentional morning ritual.',
  },
  {
    name: 'Full-Grain Leather Bifold Wallet',
    category: 'Accessories',
    price: 89,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop&auto=format',
    description: 'Slim bifold in full-grain vegetable-tanned leather. 6 card slots, ID window. Ages beautifully over time.',
  },
  {
    name: 'Natural Rubber Yoga Mat',
    category: 'Sports',
    price: 95,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop&auto=format',
    description: 'Eco-certified natural rubber with alignment markers. Non-slip surface, 6mm cushion, carrying strap included.',
  },
  {
    name: 'Adjustable Brass Desk Lamp',
    category: 'Home',
    price: 165,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop&auto=format',
    description: 'Articulated brass desk lamp with warm LED, touch dimmer, and USB-A charging port. Industrial warmth for any workspace.',
  },
  {
    name: 'Tactile Mechanical Keyboard',
    category: 'Electronics',
    price: 219,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop&auto=format',
    description: '75% layout with tactile brown switches, PBT keycaps, hot-swap sockets. USB-C, gasket mount, aluminum case.',
  },
  {
    name: 'Heavyweight Canvas Tote Bag',
    category: 'Accessories',
    price: 42,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop&auto=format',
    description: '16oz natural canvas with reinforced seams and interior zip pocket. Fits a 15" laptop. Gets better with every wash.',
  },
];

async function main() {
  console.log('Seeding categories…');
  const categoryBySlug = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryBySlug.set(cat.name, created.id);
  }

  console.log('Seeding products…');
  const products = [];
  for (const p of PRODUCTS) {
    const categoryId = categoryBySlug.get(p.category)!;
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    const product =
      existing ??
      (await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.imageUrl,
          categoryId,
        },
      }));
    products.push(product);
  }

  console.log('Seeding users…');
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const customerPasswordHash = await bcrypt.hash('Customer123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@minishop.dev' },
    update: {},
    create: { email: 'admin@minishop.dev', passwordHash: adminPasswordHash, name: 'Admin', role: Role.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: 'customer@minishop.dev' },
    update: {},
    create: {
      email: 'customer@minishop.dev',
      passwordHash: customerPasswordHash,
      name: 'Olena Kovalenko',
      role: Role.CUSTOMER,
    },
  });

  console.log('Seed complete.');
  console.log(`Admin login:    admin@minishop.dev / Admin123!`);
  console.log(`Customer login: customer@minishop.dev / Customer123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
