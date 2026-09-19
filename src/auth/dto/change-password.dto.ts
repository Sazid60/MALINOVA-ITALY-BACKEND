import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123' })
  @IsString()
  CurrentPassword: string;

  @ApiProperty({ example: 'NewPass@456', minLength: 6 })
  @IsString()
  @MinLength(6)
  NewPassword: string;
}
