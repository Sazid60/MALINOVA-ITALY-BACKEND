import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientResetRequestDto {
  @ApiProperty({ example: '01712345678 or client@example.com' })
  @IsString()
  identifier: string;
}

export class ClientResetVerifyDto {
  @ApiProperty({ example: '01712345678 or client@example.com' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

export class ClientResetSubmitDto {
  @ApiProperty({ example: '01712345678 or client@example.com' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  password: string;
}
