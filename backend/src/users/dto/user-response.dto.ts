import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() email!: string;
  @Expose() @ApiProperty() name!: string;
  @Expose() @ApiProperty({ enum: Role }) role!: Role;
  @Expose() @ApiProperty() createdAt!: Date;
}
