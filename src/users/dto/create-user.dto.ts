import { IsEmail, IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty() @IsString() username: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty() @IsString() @MinLength(10, { message: 'Invalid mobile number' }) mobile_number: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() role_id?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
