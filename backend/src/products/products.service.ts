import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

const LIST_TTL_SECONDS = 60;
const DETAIL_TTL_SECONDS = 60;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: ProductsRepository,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: QueryProductsDto) {
    const version = await this.cache.getProductsVersion();
    const cacheKey = `products:list:v${version}:${JSON.stringify(query)}`;

    const cached = await this.cache.get<{ items: unknown[]; total: number }>(cacheKey);
    if (cached) {
      return { ...cached, page: query.page, limit: query.limit };
    }

    const { items, total } = await this.repository.findMany(query);
    await this.cache.set(cacheKey, { items, total }, LIST_TTL_SECONDS);
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string) {
    const cacheKey = `products:detail:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundException('Товар не знайдено');

    await this.cache.set(cacheKey, product, DETAIL_TTL_SECONDS);
    return product;
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({ data: dto, include: { category: true } });
    await this.cache.bumpProductsVersion();
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
    await this.cache.bumpProductsVersion();
    await this.cache.del(`products:detail:${id}`);
    return product;
  }

  async remove(id: string) {
    await this.prisma.product.delete({ where: { id } });
    await this.cache.bumpProductsVersion();
    await this.cache.del(`products:detail:${id}`);
  }

  async setImageUrl(id: string, imageUrl: string) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { imageUrl },
      include: { category: true },
    });
    await this.cache.bumpProductsVersion();
    await this.cache.del(`products:detail:${id}`);
    return product;
  }
}
