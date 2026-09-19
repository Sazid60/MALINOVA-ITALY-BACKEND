import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductWarrantyComponentDto {
  @IsNumber()
  @IsNotEmpty()
  warranty_policy_id: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  warranty_months?: number;

  @IsBoolean()
  @IsOptional()
  service_coverage?: boolean;

  @IsBoolean()
  @IsOptional()
  parts_coverage?: boolean;

  @IsString()
  @IsOptional()
  customer_policy_note?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  category_id?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber() @IsOptional()
  brand_id?: number;

  @IsNumber() @IsOptional()
  base_price?: number;

  @IsNumber() @IsOptional() @Min(0)
  weight_grams?: number;

  @IsString() @IsOptional() @IsIn(['fixed', 'percentage', 'none'])
  discount_type?: string;

  @IsNumber() @IsOptional()
  discount_value?: number;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateProductWarrantyComponentDto)
  warranty_components?: CreateProductWarrantyComponentDto[];

  @IsString() @IsOptional()
  country_of_origin?: string;

  @IsString() @IsOptional()
  serial_number?: string;

  @IsBoolean() @IsOptional()
  emi_available?: boolean;

  @IsString() @IsOptional()
  product_video_url?: string;

  @IsOptional()
  specifications_json?: Record<string, any>;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'draft'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @IsNumber()
  @IsOptional()
  low_stock_threshold?: number;

  @IsNumber()
  @IsOptional()
  lifecycle_months?: number;
}
