import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  mapPagination,
  resolveMediaUrl,
} from "@/features/catalog/utils";
import type {
  AdminProductDetail,
  AdminProductFilters,
  AdminProductListResponse,
  AdminProductVariant,
  CreateProductInput,
  ProductImage,
  ProductListFilters,
  ProductListItem,
  ProductListResponse,
  UpdateProductInput,
} from "./types";

function mapImage(raw: unknown, index = 0): ProductImage | null {
  if (typeof raw === "string") {
    return {
      path: raw,
      url: resolveMediaUrl(raw),
      alt: null,
      sortOrder: index,
    };
  }
  const r = (raw ?? {}) as Record<string, unknown>;
  const path = asString(r.url) || asString(r.path);
  if (!path) return null;
  return {
    path,
    url: resolveMediaUrl(path),
    alt: asString(r.alt),
    sortOrder: asNumber(r.sortOrder) ?? index,
  };
}

function mapProductListItem(raw: unknown): ProductListItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title);
  const slug = asString(r.slug);
  if (!id || !title || !slug) return null;

  const brand = (r.brand ?? null) as Record<string, unknown> | null;
  const category = (r.category ?? {}) as Record<string, unknown>;
  const imagesRaw = Array.isArray(r.images) ? r.images : [];

  return {
    id,
    title,
    slug,
    categoryId: asString(r.categoryId) ?? "",
    status: asString(r.status) ?? "PENDING",
    updatedAt: asString(r.updatedAt) ?? "",
    isFeatured: Boolean(r.isFeatured),
    viewCount: asNumber(r.viewCount) ?? 0,
    saleCount: asNumber(r.saleCount) ?? 0,
    rating: asNumber(r.rating) ?? 0,
    reviewCount: asNumber(r.reviewCount) ?? 0,
    storeId: asString(r.storeId),
    brandId: asString(r.brandId),
    originalPrice: asNumber(r.originalPrice),
    minPrice: asNumber(r.minPrice),
    discountPercent: asNumber(r.discountPercent),
    brand: brand
      ? {
          name: asString(brand.name) ?? "",
          slug: asString(brand.slug) ?? "",
        }
      : null,
    category: {
      name: asString(category.name) ?? "",
      slug: asString(category.slug) ?? "",
      icon: asString(category.icon),
    },
    images: imagesRaw
      .map((img, i) => mapImage(img, i))
      .filter((x): x is ProductImage => x !== null),
  };
}

function mapAdminVariant(raw: unknown): AdminProductVariant | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  if (!id || !name) return null;
  const discount = r.discount as Record<string, unknown> | null | undefined;
  return {
    id,
    name,
    sku: asString(r.sku),
    price: asNumber(r.price),
    quantity: asNumber(r.quantity) ?? 0,
    discountId: asString(r.discountId),
    discount: discount
      ? {
          type: asString(discount.type) ?? "",
          value: asString(discount.value) ?? "",
          isActive: Boolean(discount.isActive),
          startsAt: asString(discount.startsAt),
          endsAt: asString(discount.endsAt),
        }
      : null,
  };
}

function mapAdminProduct(raw: unknown): AdminProductDetail | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title);
  const slug = asString(r.slug);
  if (!id || !title || !slug) return null;

  const category = (r.category ?? {}) as Record<string, unknown>;
  const store = r.store as Record<string, unknown> | null | undefined;
  const imagesRaw = Array.isArray(r.images) ? r.images : [];
  const variantsRaw = Array.isArray(r.variants) ? r.variants : [];

  return {
    id,
    title,
    slug,
    description: asString(r.description),
    categoryId: asString(r.categoryId) ?? "",
    status: asString(r.status) ?? "PENDING",
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    isFeatured: Boolean(r.isFeatured),
    viewCount: asNumber(r.viewCount) ?? 0,
    saleCount: asNumber(r.saleCount) ?? 0,
    rating: asNumber(r.rating) ?? 0,
    reviewCount: asNumber(r.reviewCount) ?? 0,
    storeId: asString(r.storeId),
    originalPrice: asNumber(r.originalPrice),
    minPrice: asNumber(r.minPrice),
    discountPercent: asNumber(r.discountPercent),
    images: imagesRaw
      .map((img, i) => {
        const m = mapImage(img, i);
        if (!m) return null;
        const ir = (img ?? {}) as Record<string, unknown>;
        return {
          id: asString(ir.id) ?? `${id}-${i}`,
          alt: m.alt,
          url: m.url,
          path: m.path,
        };
      })
      .filter(Boolean) as AdminProductDetail["images"],
    category: {
      id: asString(category.id) ?? "",
      name: asString(category.name) ?? "",
      slug: asString(category.slug) ?? "",
      parentId: asString(category.parentId),
    },
    store: store
      ? {
          id: asString(store.id) ?? "",
          name: asString(store.name) ?? "",
        }
      : null,
    variants: variantsRaw
      .map(mapAdminVariant)
      .filter((v): v is AdminProductVariant => v !== null),
  };
}

const PUBLIC_SORTS = new Set([
  "price_asc",
  "price_desc",
  "newest",
  "oldest",
  "popular",
  "rating",
]);

function toPublicSort(sort: ProductListFilters["sort"] | undefined): string {
  if (sort && PUBLIC_SORTS.has(sort)) return sort;
  return "newest";
}

/** GET /products — Public */
export async function fetchProducts(
  filters: ProductListFilters = {},
): Promise<ProductListResponse> {
  const { data } = await apiClient.get("/products", {
    params: {
      category: filters.category || undefined,
      seller: filters.seller || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      // همیشه یک مقدار معتبر swagger بفرست — نه undefined
      sort: toPublicSort(filters.sort),
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.products ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    products: list
      .map(mapProductListItem)
      .filter((p): p is ProductListItem => p !== null),
  };
}

/** GET /products/{idOrSlug} — Public detail */
export async function fetchProductByIdOrSlug(
  idOrSlug: string,
): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get(
    `/products/${encodeURIComponent(idOrSlug)}`,
  );
  return (data ?? {}) as Record<string, unknown>;
}

/** GET /products/{slug}/related */
export async function fetchRelatedProducts(
  slug: string,
): Promise<ProductListItem[]> {
  const { data } = await apiClient.get(
    `/products/${encodeURIComponent(slug)}/related`,
  );
  return asArray(data)
    .map(mapProductListItem)
    .filter((p): p is ProductListItem => p !== null);
}

/**
 * swagger GET /products/ADMIN status enum:
 * all | DRAFT | PENDING | ACTIVE | REJECTED | INACTIVE | OUT_OF_STOCK | DELETED | BANNED
 * UI legacy «APPROVED» → ACTIVE
 */
function toAdminStatusParam(
  status: AdminProductFilters["status"],
): string | undefined {
  if (!status || status === "ALL" || status === "all") return "all";
  const s = String(status).toUpperCase();
  if (s === "APPROVED") return "ACTIVE";
  return s;
}

/** GET /products/ADMIN — Admin & Store */
export async function fetchAdminProducts(
  filters: AdminProductFilters = {},
): Promise<AdminProductListResponse> {
  const { data } = await apiClient.get("/products/ADMIN", {
    params: {
      status: toAdminStatusParam(filters.status),
      featured:
        typeof filters.featured === "boolean"
          ? String(filters.featured)
          : undefined,
      discountId: filters.discountId,
      search: filters.search || undefined,
      sort: filters.sort,
      categoryId: filters.categoryId,
      sellerId: filters.sellerId,
      brandId: filters.brandId,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    },
  });

  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.products ?? r.data ?? data);

  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    products: list
      .map(mapAdminProduct)
      .filter((p): p is AdminProductDetail => p !== null),
  };
}

/** POST /products — Admin & Store */
export async function createProduct(
  payload: CreateProductInput,
): Promise<unknown> {
  const { data } = await apiClient.post("/products", payload);
  return data;
}

/** PUT /products/{id} */
export async function updateProduct(
  id: string,
  payload: UpdateProductInput,
): Promise<unknown> {
  const { data } = await apiClient.put(
    `/products/${encodeURIComponent(id)}`,
    payload,
  );
  return data;
}

/** DELETE /products/{id} */
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${encodeURIComponent(id)}`);
}

/** PATCH /products/admin/{id}/approve */
export async function approveProduct(id: string): Promise<void> {
  await apiClient.patch(`/products/admin/${encodeURIComponent(id)}/approve`);
}

/** PATCH /products/admin/{id}/feature */
export async function toggleProductFeature(id: string): Promise<void> {
  await apiClient.patch(`/products/admin/${encodeURIComponent(id)}/feature`);
}
