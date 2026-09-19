import { IsEmail, IsString, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientUpdateProfileDto {
  @ApiProperty({ example: 'client@example.com', required: false })
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '01712345678', required: false })
  @IsString()
  @IsOptional()
  mobile_number?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Gulshan', required: false })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiProperty({ example: 'Dhaka', required: false })
  @IsString()
  @IsOptional()
  city?: string;
}
