import { IsEmail, IsString, MinLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetDTO {
  @ApiProperty({ example: 'admin@acharshop.com' })
  @IsEmail()
  Email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  VerificationNo: string;

  @ApiProperty({ example: 'NewPass@456', minLength: 6 })
  @IsString()
  @MinLength(6)
  NewPassword: string;
}
