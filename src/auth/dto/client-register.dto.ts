import { IsEmail, IsString, MinLength, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientRegisterDto {
  @ApiProperty({ example: 'client@example.com', required: false })
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '01712345678' })
  @IsString()
  mobile_number: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Gulshan' })
  @IsString()
  area: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  city: string;
}
