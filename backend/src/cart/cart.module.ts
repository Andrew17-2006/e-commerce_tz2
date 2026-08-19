import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { CartController } from './cart.controller';

@Module({
  providers: [CartService, CartRepository],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
