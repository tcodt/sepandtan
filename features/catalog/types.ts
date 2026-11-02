/* -------------------------------------------------------------------------- */
/* Shared pagination                                                          */
/* -------------------------------------------------------------------------- */

export type PaginationMeta = {
  total: number;
  nextPage: number | null;
  prevPage: number | null;
};

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export type CategoryTree = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  children: CategoryTree[];
};

export type CategorySelectorItem = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryAdmin = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
  image: string | null;
  ancestorIds: string[];
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  children: CategoryTree[];
  productCount: number;
};

export type CategoriesAdminResponse = {
  pagination: PaginationMeta;
  categories: CategoryAdmin[];
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  image?: string;
  isActive?: boolean;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CategoriesAdminFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
};

/* -------------------------------------------------------------------------- */
/* Brands                                                                     */
/* -------------------------------------------------------------------------- */

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

export type BrandAdmin = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  sortOrder: number;
  productCount: number;
};

export type BrandsAdminResponse = {
  pagination: PaginationMeta;
  brands: BrandAdmin[];
};

export type BrandInput = {
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  sortOrder?: number;
};

export type BrandsAdminFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
};

/* -------------------------------------------------------------------------- */
/* Colors                                                                     */
/* -------------------------------------------------------------------------- */

export type Color = {
  id: string;
  name: string;
  hexCode: string;
  slug: string;
};

export type ColorAdmin = Color & {
  createdAt: string;
  updatedAt: string;
  productVariantCount: number;
};

export type ColorsAdminResponse = {
  pagination: PaginationMeta;
  colors: ColorAdmin[];
};

export type CreateColorInput = {
  name: string;
  slug: string;
  hexCode: string;
};

export type UpdateColorInput = {
  slug: string;
  name?: string;
  hexCode?: string;
};

export type ColorsAdminFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
};

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

export type MediaUseCase =
  | "AVATAR"
  | "PRODUCT"
  | "POST"
  | "ATTACHMENT"
  | "THUMBNAIL"
  | "WATERMARK"
  | "REPORTS"
  | "MAINS"
  | "ALL";

export type MediaType = "VIDEO" | "IMAGE" | "VOICE" | "FILE" | "OTHER";

export type MediaItem = {
  id: string;
  url: string;
  /** relative path از بک‌اند؛ برای نمایش با resolveMediaUrl */
  path: string;
  alt: string | null;
  useCase: Exclude<MediaUseCase, "ALL"> | string;
  type: MediaType | string;
  sortOrder: number;
  isMain: boolean;
  productId: string | null;
  createdAt: string;
};

export type MediaListResponse = {
  pagination: PaginationMeta;
  media: MediaItem[];
};

export type MediaListFilters = {
  page?: number;
  limit?: number;
  useCase: MediaUseCase;
  order?: string;
  isMain?: boolean;
  productId?: string;
  url?: string;
};

export type UploadMediaInput = {
  file: File;
  alt?: string;
  useCase?: Exclude<MediaUseCase, "ALL">;
  type?: MediaType;
  productId?: string;
  sortOrder?: number;
  isMain?: boolean;
  reportsId?: string;
  ticketMessageId?: string;
  returnRequestId?: string;
};
