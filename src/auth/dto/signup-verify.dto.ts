import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupVerifyDTO {
  @ApiProperty({ example: 'admin@acharshop.com' })
  @IsEmail()
  Email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP sent to email' })
  @IsString()
  @Length(6, 6)
  VerificationNo: string;
}
