import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestDTO {
  @ApiProperty({ example: 'admin@acharshop.com' })
  @IsEmail()
  Email: string;
}
