import { Injectable } from '@nestjs/common';
import { CacheService } from '../redis/cache.service';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly repository: CategoriesRepository,
    private readonly cache: CacheService,
  ) {}

  findAll() {
    return this.repository.findAll();
  }

  findOne(id: string) {
    return this.repository.findOne(id);
  }

  async create(dto: CreateCategoryDto) {
    const category = await this.repository.create(dto);
    await this.cache.bumpProductsVersion();
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.repository.update(id, dto);
    await this.cache.bumpProductsVersion();
    return category;
  }

  async remove(id: string) {
    await this.repository.remove(id);
    await this.cache.bumpProductsVersion();
  }
}
