import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('Користувача не знайдено');
    return user;
  }

  create(data: { email: string; passwordHash: string; name: string }): Promise<User> {
    return this.repository.create(data);
  }

  setRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<User> {
    return this.repository.setRefreshTokenHash(userId, refreshTokenHash);
  }
}
