import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SanitizeHtml } from '../../common/sanitize';

export class CreateCategoryDto {
  @ApiProperty()
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @SanitizeHtml()
  @IsString()
  @MaxLength(500)
  description?: string;
}
