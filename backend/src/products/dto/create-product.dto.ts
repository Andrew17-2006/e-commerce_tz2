import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizeHtml } from '../../common/sanitize';

export class CreateProductDto {
  @ApiProperty()
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
