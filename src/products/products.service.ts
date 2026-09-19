import { Injectable, NotFoundException, ConflictException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Product } from './product.entity';
import { ProductCategory } from './product-category.entity';
import { ProductImage } from './product-image.entity';
import { SeoMeta } from './seo-meta.entity';
import { Brand } from './brand.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CloudinaryService } from '../upload/cloudinary.service';
import { ProductAttributeDefinition } from './product-attribute-definition.entity';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';
import { CategoryImage } from './category-image.entity';

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(ProductCategory) private catRepo: Repository<ProductCategory>,
    @InjectRepository(Brand) private brandRepo: Repository<Brand>,
    @InjectRepository(ProductImage) private imgRepo: Repository<ProductImage>,
    @InjectRepository(SeoMeta) private seoRepo: Repository<SeoMeta>,
    @InjectRepository(CategoryImage) private catImageRepo: Repository<CategoryImage>,
    @InjectRepository(ProductAttributeDefinition) private attrDefRepo: Repository<ProductAttributeDefinition>,
    private cloudinary: CloudinaryService,
    private dataSource: DataSource,
  ) { }

  async onModuleInit() {
    setTimeout(() => this.backfillProductSeo(), 5000);
  }

  // ── Categories ──────────────────────────────────────────────────────────────────────────────────────
  findAllCategories() { return this.catRepo.find({ where: { is_deleted: false }, relations: ['parent'], order: { name: 'ASC' } }); }

  // ── Attribute Definitions ─────────────────────────────
  async findAttributesByCategory(categoryId: number) {
    const categoryIds: number[] = [];
    let currentId: number | null = categoryId;
    
    // We can query recursively by walking parent_id
    while (currentId) {
      categoryIds.push(currentId);
      const cat = await this.catRepo.findOne({
        where: { id: currentId, is_deleted: false },
        select: ['id', 'parent_id'],
      });
      currentId = cat?.parent_id ? Number(cat.parent_id) : null;
    }

    if (categoryIds.length === 0) return [];

    return this.attrDefRepo.createQueryBuilder('attr')
      .where('attr.category_id IN (:...categoryIds) AND attr.status = :status', { categoryIds, status: 'active' })
      .orderBy('attr.sort_order', 'ASC')
      .addOrderBy('attr.label', 'ASC')
      .getMany();
  }

  async createAttribute(categoryId: number, dto: CreateAttributeDefinitionDto) {
    const cat = await this.catRepo.findOne({ where: { id: categoryId, is_deleted: false } });
    if (!cat) throw new NotFoundException('Category not found');

    const existing = await this.attrDefRepo.findOne({
      where: { category_id: categoryId, key: dto.key },
    });
    if (existing) throw new ConflictException('Attribute key already exists for this category');

    return this.attrDefRepo.save(this.attrDefRepo.create({ ...dto, category_id: categoryId }));
  }

  async updateAttribute(id: number, dto: UpdateAttributeDefinitionDto) {
    const attr = await this.attrDefRepo.findOne({ where: { id } });
    if (!attr) throw new NotFoundException('Attribute definition not found');
    return this.attrDefRepo.save({ ...attr, ...dto });
  }

  async deleteAttribute(id: number) {
    const attr = await this.attrDefRepo.findOne({ where: { id } });
    if (!attr) throw new NotFoundException('Attribute definition not found');
    attr.status = 'inactive';
    return this.attrDefRepo.save(attr);
  }

  async findAllCategoriesPaginated(page = 1, limit = 20, search?: string) {
    const allCategories = await this.catRepo.find({
      where: { is_deleted: false },
      relations: ['parent'],
      order: { name: 'ASC' },
    });

    const categoryMap = new Map<number, ProductCategory>();
    const childrenMap = new Map<number, ProductCategory[]>();

    allCategories.forEach((cat) => {
      categoryMap.set(Number(cat.id), cat);
      if (cat.parent_id) {
        const pid = Number(cat.parent_id);
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid)!.push(cat);
      }
    });

    // Helper to find the top-level root for any category
    const findRoot = (cat: ProductCategory): ProductCategory => {
      let current = cat;
      const visited = new Set<number>([Number(current.id)]);
      while (current.parent_id) {
        const pid = Number(current.parent_id);
        if (visited.has(pid)) break;
        visited.add(pid);
        const parent = categoryMap.get(pid);
        if (!parent) break;
        current = parent;
      }
      return current;
    };

    let targetRoots: ProductCategory[] = [];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const matchedRootIds = new Set<number>();

      allCategories.forEach((cat) => {
        const nameMatch = cat.name?.toLowerCase().includes(q);
        const descMatch = cat.description?.toLowerCase().includes(q);
        if (nameMatch || descMatch) {
          const root = findRoot(cat);
          matchedRootIds.add(Number(root.id));
        }
      });

      targetRoots = allCategories
        .filter((c) => matchedRootIds.has(Number(c.id)) && (!c.parent_id || !categoryMap.has(Number(c.parent_id))))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Top-level root categories only
      targetRoots = allCategories
        .filter((c) => !c.parent_id || !categoryMap.has(Number(c.parent_id)))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = targetRoots.length;
    const paginatedRoots = targetRoots.slice((page - 1) * limit, page * limit);

    // Collect all descendants for these paginated roots
    const resultCategories: ProductCategory[] = [];
    const visitedCollect = new Set<number>();

    const collectTree = (cat: ProductCategory) => {
      const id = Number(cat.id);
      if (visitedCollect.has(id)) return;
      visitedCollect.add(id);
      resultCategories.push(cat);
      const children = childrenMap.get(id) || [];
      children.sort((a, b) => a.name.localeCompare(b.name));
      children.forEach((child) => collectTree(child));
    };

    paginatedRoots.forEach((root) => collectTree(root));

    return { data: resultCategories, total, page, limit };
  }

  async createCategory(dto: CreateCategoryDto) {
    let slug = slugify(dto.name);
    
    if (dto.parent_id) {
      const parent = await this.catRepo.findOne({ where: { id: dto.parent_id, is_deleted: false } });
      if (!parent) throw new NotFoundException('Parent category not found');
      slug = `${parent.slug}-${slug}`;
    }

    const existing = await this.catRepo.findOne({ where: { slug } });
    if (existing) {
      if (existing.is_deleted) {
        return this.catRepo.save({
          ...existing,
          ...dto,
          is_deleted: false,
        });
      }
      throw new ConflictException('Category with this name/slug already exists');
    }

    return this.catRepo.save(this.catRepo.create({ ...dto, slug }));
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const cat = await this.catRepo.findOne({ where: { id, is_deleted: false } });
    if (!cat) throw new NotFoundException('Category not found');

    if (dto.parent_id && dto.parent_id === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    if (dto.parent_id) {
      const parent = await this.catRepo.findOne({ where: { id: dto.parent_id, is_deleted: false } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    if (dto.name && dto.name !== cat.name) {
      let slug = slugify(dto.name);
      const parentId = dto.parent_id !== undefined ? dto.parent_id : cat.parent_id;
      if (parentId) {
        const parent = await this.catRepo.findOne({ where: { id: parentId } });
        if (parent) {
          slug = `${parent.slug}-${slug}`;
        }
      }
      const existing = await this.catRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name/slug already exists');
      }
      cat.slug = slug;
    }

    const saved = await this.catRepo.save({ ...cat, ...dto });

    if (dto.status === 'inactive') {
      await this.deactivateDescendants(id);
    }

    return saved;
  }

  private async deactivateDescendants(parentId: number) {
    const children = await this.catRepo.find({ where: { parent_id: parentId, is_deleted: false } });
    for (const child of children) {
      child.status = 'inactive';
      await this.catRepo.save(child);
      await this.deactivateDescendants(child.id);
    }
  }

  async deleteCategory(id: number) {
    const cat = await this.catRepo.findOne({ where: { id, is_deleted: false } });
    if (!cat) throw new NotFoundException();

    await this.softDeleteDescendants(id);

    cat.is_deleted = true;
    cat.slug = `${cat.slug}-deleted-${Date.now()}`;
    await this.catRepo.save(cat);
    return { message: 'Category deleted' };
  }

  private async softDeleteDescendants(parentId: number) {
    const children = await this.catRepo.find({ where: { parent_id: parentId, is_deleted: false } });
    for (const child of children) {
      child.is_deleted = true;
      child.slug = `${child.slug}-deleted-${Date.now()}`;
      await this.catRepo.save(child);
      await this.softDeleteDescendants(child.id);
    }
  }

  // ── Category Image CRUD ─────────────────────────────────────────
  async addCategoryImage(categoryId: number, image_url: string, is_primary = false) {
    const cat = await this.catRepo.findOne({ where: { id: categoryId, is_deleted: false } });
    if (!cat) throw new NotFoundException('Category not found');

    if (is_primary) {
      await this.catImageRepo.update({ category_id: categoryId }, { is_primary: false });
    }

    const image = this.catImageRepo.create({
      category_id: categoryId,
      image_url,
      is_primary,
      status: 'active',
    });
    return this.catImageRepo.save(image);
  }

  async deleteCategoryImage(imageId: number) {
    const image = await this.catImageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Category image not found');
    await this.catImageRepo.remove(image);
    return { message: 'Category image deleted' };
  }

  async findCategoryTree() {
    const categories = await this.catRepo.find({
      where: { is_deleted: false },
      order: { name: 'ASC' },
    });

    const idMap: Record<number, any> = {};
    categories.forEach((cat) => {
      idMap[cat.id] = { ...cat, children: [] };
    });

    const tree: any[] = [];
    categories.forEach((cat) => {
      const mapped = idMap[cat.id];
      if (cat.parent_id) {
        const parent = idMap[cat.parent_id];
        if (parent) {
          parent.children.push(mapped);
        } else {
          tree.push(mapped);
        }
      } else {
        tree.push(mapped);
      }
    });

    return tree;
  }

  // ── Products ─────────────────────────────────────────────────
  // async findAll(page = 1, limit = 20, search?: string, categoryId?: number, status?: string) {
  //   const qb = this.repo.createQueryBuilder('p')
  //     .leftJoinAndSelect('p.category', 'cat')
  //     .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true')
  //     .leftJoinAndSelect('p.variants', 'v', "v.status != 'inactive'")
  //     .orderBy('p.created_at', 'DESC');
  //   if (search) qb.andWhere('p.name ILIKE :s', { s: `%${search}%` });
  //   if (categoryId) qb.andWhere('p.category_id = :categoryId', { categoryId });
  //   if (status) qb.andWhere('p.status = :status', { status });
  //   const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
  //   return { data, total, page, limit };
  // }

  // ── Products ─────────────────────────────────────────────────
  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    categoryId?: number,
    status?: string,
    stockLevel?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
    brandId?: number,
  ) {
    const qb = this.repo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.category", "cat")
      .leftJoinAndSelect("p.brand", "brand")
      .leftJoinAndSelect("p.images", "img", "img.is_primary = true AND img.is_deleted = :is_deleted", { is_deleted: false })
      .where("p.is_deleted = :is_deleted", { is_deleted: false });

    if (search) {
      qb.andWhere("(p.name ILIKE :s OR p.serial_number ILIKE :s)", { s: `%${search}%` });
    }
    if (categoryId) qb.andWhere("p.category_id = :categoryId", { categoryId });
    if (brandId) qb.andWhere("p.brand_id = :brandId", { brandId });
    if (status) qb.andWhere("p.status = :status", { status });

    // sorting (A–Z / Z–A / default)
    const allowedSortBy: Record<string, string> = {
      name: "p.name",
      created_at: "p.created_at",
    };
    const sortColumn = allowedSortBy[sortBy ?? "created_at"] ?? "p.created_at";
    const direction = sortOrder === "asc" ? "ASC" : "DESC";
    qb.orderBy(sortColumn, direction);
    qb.addOrderBy("p.id", "ASC");
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findProductsWithFilters(
    page = 1,
    limit = 20,
    categoryId?: number,
    brandId?: number,
    specs?: Record<string, any>,
    minPrice?: number,
    maxPrice?: number,
  ) {
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.images', 'img', 'img.is_primary = true AND img.is_deleted = :is_deleted', { is_deleted: false })
      .where('p.is_deleted = :is_deleted', { is_deleted: false });

    if (categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId });
    }
    if (brandId) {
      qb.andWhere('p.brand_id = :brandId', { brandId });
    }
    if (minPrice !== undefined) {
      qb.andWhere('p.final_price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('p.final_price <= :maxPrice', { maxPrice });
    }

    if (specs && Object.keys(specs).length > 0) {
      qb.andWhere('p.specifications_json @> :specs', { specs: JSON.stringify(specs) });
    }

    qb.orderBy('p.created_at', 'DESC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({
      where: { id, is_deleted: false },
      relations: ['category', 'brand', 'images'],
    });
    if (!p) throw new NotFoundException('Product not found');
    if (p.images) p.images = p.images.filter(img => !img.is_deleted);
    const seo = await this.seoRepo.findOne({ where: { entity_type: 'product', entity_id: p.id } });
    (p as any).seo_meta = seo || null;
    (p as any).warranty_components = [];
    return p;
  }

  async findBySlug(slug: string) {
    const p = await this.repo.findOne({
      where: { slug, is_deleted: false },
      relations: ['category', 'brand', 'images'],
    });
    if (!p) throw new NotFoundException('Product not found');
    if (p.images) p.images = p.images.filter(img => !img.is_deleted);
    const seo = await this.seoRepo.findOne({ where: { entity_type: 'product', entity_id: p.id } });
    (p as any).seo_meta = seo || null;
    (p as any).warranty_components = [];
    return p;
  }

  async create(dto: any): Promise<Product | null> {
    if (dto.category_id) {
      const cat = await this.catRepo.findOne({ where: { id: dto.category_id } });
      if (!cat) throw new BadRequestException('Invalid category ID');
    }

    if (dto.brand_id) {
      const brand = await this.brandRepo.findOne({ where: { id: dto.brand_id } });
      if (!brand) throw new BadRequestException('Invalid brand ID');
    }

    // Auto-calculate final_price
    let final_price = dto.base_price || 0;
    if (dto.base_price && dto.discount_type && dto.discount_value) {
      if (dto.discount_type === 'percentage') {
        final_price = dto.base_price - (dto.base_price * dto.discount_value / 100);
      } else if (dto.discount_type === 'fixed') {
        final_price = dto.base_price - dto.discount_value;
      }
    }
    if (final_price < 0) final_price = 0;
    dto.final_price = final_price;

    // Auto-generate serial_number / model number if not provided
    if (!dto.serial_number) {
      const cleanName = dto.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const prefix = cleanName.slice(0, 4);
      const rand = Math.floor(100 + Math.random() * 900);
      dto.serial_number = `MOD-${prefix}-${rand}`;
    }

    const slug = slugify(dto.name);
    const existing = await this.repo.findOne({ where: { slug, is_deleted: false } });
    if (existing) {
      throw new ConflictException('A product with this name already exists.');
    }

// Default lifecycle to 365 days (12 months) when adding a product
    if (!dto.lifecycle_months || Number(dto.lifecycle_months) <= 0 || Number.isNaN(Number(dto.lifecycle_months))) {
      dto.lifecycle_months = 12;
    }

    const { warranty_components, ...productFields } = dto;
    const saved = await this.repo.save(
      Object.assign(new Product(), { ...productFields, slug })
    );

    const fullProduct = await this.findOne(saved.id);
    if (fullProduct) {
      await this.autoGenerateSeoForProduct(fullProduct);
    }

    return fullProduct;
  }

  async update(id: number, dto: any) {
    const p = await this.findOne(id);
    
    if (dto.category_id) {
      const cat = await this.catRepo.findOne({ where: { id: dto.category_id } });
      if (!cat) throw new BadRequestException('Invalid category ID');
    }

    if (dto.brand_id) {
      const brand = await this.brandRepo.findOne({ where: { id: dto.brand_id } });
      if (!brand) throw new BadRequestException('Invalid brand ID');
    }

    // Re-compute final_price
    const base_price = dto.base_price !== undefined ? dto.base_price : p.base_price;
    let discount_type = dto.discount_type !== undefined ? dto.discount_type : p.discount_type;
    let discount_value = dto.discount_value !== undefined ? dto.discount_value : p.discount_value;

    if (discount_type === 'none') {
      discount_type = null;
      discount_value = 0;
      dto.discount_type = null;
      dto.discount_value = 0;
    }

    let final_price = base_price || 0;
    if (base_price && discount_type && discount_value) {
      if (discount_type === 'percentage') {
        final_price = base_price - (base_price * discount_value / 100);
      } else if (discount_type === 'fixed') {
        final_price = base_price - discount_value;
      }
    }
    if (final_price < 0) final_price = 0;
    dto.final_price = final_price;

    const { seo_meta, warranty_components: oldWc, ...productData } = p as any;
    const { warranty_components, ...dtoFields } = dto;
    await this.repo.save({ ...productData, ...dtoFields });

    const fullProduct = await this.findOne(id);
    if (fullProduct) {
      await this.autoGenerateSeoForProduct(fullProduct);
    }
    return fullProduct;
  }

  async setFeatured(id: number, is_featured: boolean) {
    const p = await this.findOne(id);
    const { seo_meta, ...productData } = p as any;
    return this.repo.save({ ...productData, is_featured });
  }

  async remove(id: number) {
    const p = await this.findOne(id);
    p.is_deleted = true;
    p.slug = `${p.slug}-deleted-${Date.now()}`;
    const { seo_meta, ...productData } = p as any;
    await this.repo.save(productData);

    if (p.images) {
      for (const img of p.images) {
        img.is_deleted = true;
        await this.imgRepo.save(img);
      }
    }
    return { message: 'Product deleted' };
  }

  async findAllVariants(page = 1, limit = 20) {
    return { data: [], total: 0, page, limit };
  }

  async findActiveVariants(search?: string, limit?: number): Promise<any[]> {
    return [];
  }

  async findVariants(productId: number) {
    return [];
  }

  async createVariant(productId: number, dto: any) {
    throw new BadRequestException('Variants are deprecated');
  }

  async updateVariant(id: number, dto: any) {
    throw new BadRequestException('Variants are deprecated');
  }

  async deleteVariant(id: number) {
    throw new BadRequestException('Variants are deprecated');
  }

  // Upload multiple images at once
  async uploadMultipleImages(productId: number, files: Express.Multer.File[], isPrimary?: number) {
    await this.findOne(productId);

    const results = await Promise.all(
      files.map(async (file, index) => {
        const uploaded = await this.cloudinary.uploadFile(
          file,
          `products/product-${productId}`,
          `product-${productId}-${Date.now()}-${index}`,
        );

        const makePrimary = isPrimary !== undefined ? isPrimary === index : index === 0;
        if (makePrimary) {
          await this.imgRepo.update({ product_id: productId }, { is_primary: false });
        }

        const image = await this.imgRepo.save(
          this.imgRepo.create({
            product_id: productId,
            image_url: uploaded.url,
            cloudinary_public_id: uploaded.public_id,
            is_primary: makePrimary,
          }),
        );

        return { ...image, width: uploaded.width, height: uploaded.height, format: uploaded.format, bytes: uploaded.bytes };
      }),
    );

    return results;
  }

  // Replace/swap an existing image
  async replaceImage(imageId: number, productId: number, file: Express.Multer.File) {
    const img = await this.imgRepo.findOne({ where: { id: imageId, product_id: productId, is_deleted: false } });
    if (!img) throw new NotFoundException('Image not found');

    // Delete old from Cloudinary
    if (img.cloudinary_public_id) {
      await this.cloudinary.deleteFile(img.cloudinary_public_id);
    }

    // Upload new
    const uploaded = await this.cloudinary.uploadFile(
      file,
      `products/product-${productId}`,
      `product-${productId}-${Date.now()}`,
    );

    const updated = await this.imgRepo.save({
      ...img,
      image_url: uploaded.url,
      cloudinary_public_id: uploaded.public_id,
    });

    return { ...updated, width: uploaded.width, height: uploaded.height, format: uploaded.format, bytes: uploaded.bytes };
  }
  // ── Image upload (Multer + Cloudinary) ───────────────────────

  async uploadAndAddImage(productId: number, file: Express.Multer.File, isPrimary = false) {
    await this.findOne(productId);
    if (isPrimary) await this.imgRepo.update({ product_id: productId, is_deleted: false }, { is_primary: false });

    const uploaded = await this.cloudinary.uploadFile(
      file,
      `products/product-${productId}`,
      `product-${productId}-${Date.now()}`,
    );

    const image = await this.imgRepo.save(
      this.imgRepo.create({
        product_id: productId,
        image_url: uploaded.url,
        cloudinary_public_id: uploaded.public_id,
        is_primary: isPrimary,
      }),
    );

    return { ...image, width: uploaded.width, height: uploaded.height, format: uploaded.format, bytes: uploaded.bytes };
  }

  async addImageByUrl(productId: number, dto: { image_url: string; is_primary?: boolean }) {
    await this.findOne(productId);
    if (dto.is_primary) await this.imgRepo.update({ product_id: productId, is_deleted: false }, { is_primary: false });
    return this.imgRepo.save(this.imgRepo.create({ ...dto, product_id: productId }));
  }

  async deleteImage(id: number) {
    const img = await this.imgRepo.findOne({ where: { id, is_deleted: false } });
    if (!img) throw new NotFoundException('Image not found');
    img.is_deleted = true;
    await this.imgRepo.save(img);
    return { message: 'Image deleted' };
  }

  async setImageAsPrimary(imageId: number, productId: number) {
    const img = await this.imgRepo.findOne({ where: { id: imageId, is_deleted: false } });
    if (!img) throw new NotFoundException('Image not found');
    await this.imgRepo.update({ product_id: productId, is_deleted: false }, { is_primary: false });
    await this.imgRepo.update({ id: imageId }, { is_primary: true });
    return this.imgRepo.findOne({ where: { id: imageId, is_deleted: false } });
  }

  async getProductImages(productId: number) {
    return this.imgRepo.find({ where: { product_id: productId, is_deleted: false }, order: { is_primary: 'DESC' } });
  }

  // ── SEO ──────────────────────────────────────────────────────
  async upsertSeo(entityType: string, entityId: number, dto: any) {
    const seo = await this.seoRepo.findOne({ where: { entity_type: entityType, entity_id: entityId } });
    if (seo) return this.seoRepo.save({ ...seo, ...dto });
    return this.seoRepo.save(this.seoRepo.create({ entity_type: entityType, entity_id: entityId, ...dto }));
  }

  async backfillProductSeo() {
    try {
      const products = await this.repo.find({
        where: { is_deleted: false },
        relations: ['images'],
      });
      for (const p of products) {
        await this.autoGenerateSeoForProduct(p);
      }
      console.log(`[SEO Backfill] Completed product SEO backfill for ${products.length} products.`);
    } catch (err) {
      console.error('[SEO Backfill] Failed product SEO backfill:', err);
    }
  }

  async autoGenerateSeoForProduct(product: Product) {
    const defaultTitle = product.name;
    const cleanDesc = product.description ? product.description.replace(/<[^>]*>/g, '').trim() : '';
    const defaultDesc = cleanDesc.slice(0, 155) + (cleanDesc.length > 155 ? '...' : '');

    const images = product.images || [];
    const primaryImg = images.find(img => img.is_primary && !img.is_deleted) || images.find(img => !img.is_deleted);
    const defaultOgUrl = primaryImg ? primaryImg.image_url : null;
    
    const defaultKeywords = [product.name, product.category?.name, 'Bombai Achar'].filter(Boolean).join(', ');

    let seo = await this.seoRepo.findOne({ where: { entity_type: 'product', entity_id: product.id } });
    if (!seo) {
      seo = this.seoRepo.create({
        entity_type: 'product',
        entity_id: product.id,
        meta_title: defaultTitle,
        meta_description: defaultDesc || null,
        og_image_url: defaultOgUrl || null,
        keywords: defaultKeywords,
        indexable: true,
      });
      await this.seoRepo.save(seo);
    } else {
      let changed = false;
      if (!seo.meta_title) { seo.meta_title = defaultTitle; changed = true; }
      if (!seo.meta_description && defaultDesc) { seo.meta_description = defaultDesc; changed = true; }
      if (!seo.og_image_url && defaultOgUrl) { seo.og_image_url = defaultOgUrl; changed = true; }
      if (!seo.keywords) { seo.keywords = defaultKeywords; changed = true; }
      if (changed) {
        await this.seoRepo.save(seo);
      }
    }
  }

  // ── Brands CRUD ──────────────────────────────────────────────
  async findAllBrands(page = 1, limit = 20, search?: string) {
    const query = this.brandRepo.createQueryBuilder('b')
      .where('b.is_deleted = :isDeleted', { isDeleted: false });

    if (search) {
      query.andWhere('(b.name ILIKE :search OR b.description ILIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await query
      .orderBy('b.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneBrand(id: number) {
    const brand = await this.brandRepo.findOne({ where: { id, is_deleted: false } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async createBrand(dto: any) {
    const slug = slugify(dto.name);
    const existing = await this.brandRepo.findOne({ where: { slug } });
    if (existing) {
      if (existing.is_deleted) {
        return this.brandRepo.save({
          ...existing,
          ...dto,
          is_deleted: false,
        });
      }
      throw new ConflictException('Brand with this name/slug already exists');
    }
    return this.brandRepo.save(this.brandRepo.create({ ...dto, slug }));
  }

  async updateBrand(id: number, dto: any) {
    const brand = await this.findOneBrand(id);
    if (dto.name && dto.name !== brand.name) {
      const slug = slugify(dto.name);
      const existing = await this.brandRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Brand with this name/slug already exists (including soft-deleted)');
      }
      brand.slug = slug;
    }
    return this.brandRepo.save({ ...brand, ...dto });
  }

  async removeBrand(id: number) {
    const brand = await this.findOneBrand(id);
    brand.is_deleted = true;
    return this.brandRepo.save(brand);
  }
}
