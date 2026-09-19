import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductCategory } from './product-category.entity';
import { ProductImage } from './product-image.entity';
import { SeoMeta } from './seo-meta.entity';
import { Brand } from './brand.entity';
import { CategoryImage } from './category-image.entity';
import { ProductAttributeDefinition } from './product-attribute-definition.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductCategory, Brand, CategoryImage, ProductAttributeDefinition, ProductImage, SeoMeta, RolePermission, UserPermission])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
