import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template text with variables e.g. {customerName}' })
  @IsOptional()
  @IsString()
  body_template?: string;

  @ApiPropertyOptional({ description: 'Active status of the template' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Display title for the template' })
  @IsOptional()
  @IsString()
  title?: string;
}
