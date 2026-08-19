import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { SanitizeHtml } from '../../common/sanitize';

export class CheckoutDto {
  @ApiProperty()
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  shippingName!: string;

  @ApiProperty()
  @IsEmail()
  shippingEmail!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @SanitizeHtml()
  @IsString()
  shippingPhone?: string;

  @ApiProperty()
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  shippingAddress!: string;

  @ApiProperty()
  @SanitizeHtml()
  @IsString()
  @MinLength(1)
  shippingCity!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  shippingPostal!: string;

  @ApiProperty({ description: 'Mock payment — never persisted' })
  @IsString()
  @Matches(/^\d{16}$/, { message: 'Номер картки має складатися з 16 цифр' })
  cardNumber!: string;

  @ApiProperty({ description: 'Mock payment — never persisted' })
  @IsString()
  @Matches(/^\d{2}\/\d{2}$/, { message: 'Строк дії картки має бути у форматі ММ/РР' })
  cardExpiry!: string;

  @ApiProperty({ description: 'Mock payment — never persisted' })
  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'CVC-код має містити 3-4 цифри' })
  cardCvc!: string;
}
