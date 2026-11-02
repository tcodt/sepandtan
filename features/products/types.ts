import type { PaginationMeta } from "@/features/catalog/types";

export type ProductStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

export type ProductTable = {
  headers: string[];
  rows: string[][];
};

export type ProductImage = {
  alt: string | null;
  url: string; // resolved for display
  path: string; // relative for API
  sortOrder: number;
};

export type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  status: ProductStatus;
  updatedAt: string;
  isFeatured: boolean;
  viewCount: number;
  saleCount: number;
  rating: number;
  reviewCount: number;
  storeId: string | null;
  brandId: string | null;
  originalPrice: number | null;
  minPrice: number | null;
  discountPercent: number | null;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string; icon: string | null };
  images: ProductImage[];
};

export type ProductListResponse = {
  pagination: PaginationMeta;
  products: ProductListItem[];
};

export type ProductListFilters = {
  category?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?:
    | "price_asc"
    | "price_desc"
    | "newest"
    | "oldest"
    | "popular"
    | "rating";
  page?: number;
  limit?: number;
};

export type AdminProductFilters = {
  status?: ProductStatus | "ALL";
  featured?: boolean;
  discountId?: string;
  search?: string;
  sort?: string;
  categoryId?: string;
  sellerId?: string;
  brandId?: string;
  page?: number;
  limit?: number;
};

export type AdminProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  quantity: number;
  discountId: string | null;
  discount: {
    type: string;
    value: string;
    isActive: boolean;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
};

export type AdminProductDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  categoryId: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
  viewCount: number;
  saleCount: number;
  rating: number;
  reviewCount: number;
  storeId: string | null;
  originalPrice: number | null;
  minPrice: number | null;
  discountPercent: number | null;
  images: Array<{ id: string; alt: string | null; url: string; path: string }>;
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  };
  store: { id: string; name: string } | null;
  variants: AdminProductVariant[];
};

export type AdminProductListResponse = {
  pagination: PaginationMeta;
  products: AdminProductDetail[];
};

/** CreateProductDto — required: title, slug, description, productTable, categoryId */
export type CreateProductInput = {
  title: string;
  slug: string;
  description: string;
  productTable: ProductTable;
  categoryId: string;
  images?: string[]; // relative paths from media upload
  countryId?: string;
  metaTitle?: string;
  content?: string;
  brandId?: string;
  storeId?: string; // فقط ادمین
  status?: ProductStatus; // معمولاً فقط در update
};

export type UpdateProductInput = Partial<CreateProductInput>;
