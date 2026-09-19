import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSaas } from './entities/product-saas.entity';
import { ProductModule } from './entities/product-module.entity';
import { ProductsSaasService } from './products-saas.service';
import { ProductsSaasController } from './products-saas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSaas, ProductModule])],
  controllers: [ProductsSaasController],
  providers: [ProductsSaasService],
  exports: [ProductsSaasService],
})
export class ProductsSaasModule {}
