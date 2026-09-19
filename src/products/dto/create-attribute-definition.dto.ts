import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsIn, IsArray } from 'class-validator';

export class CreateAttributeDefinitionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsOptional()
  group_name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'number', 'select', 'boolean'])
  type?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsBoolean()
  @IsOptional()
  is_filterable?: boolean;

  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;

  @IsNumber()
  @IsOptional()
  sort_order?: number;
}
