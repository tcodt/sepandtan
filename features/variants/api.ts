import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  resolveMediaUrl,
} from "@/features/catalog/utils";
import type {
  AttributeDefinition,
  AttributeDefinitionFilters,
  AttributeDefinitionInput,
  CreateVariantInput,
  ProductVariant,
  UpdateVariantInput,
} from "./types";

function mapAttributeDefinition(raw: unknown): AttributeDefinition | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const key = asString(r.key);
  const label = asString(r.label);
  if (!id || !key || !label) return null;

  const cats = asArray(r.category ?? r.categories)
    .map((c) => {
      const cr = (c ?? {}) as Record<string, unknown>;
      return {
        id: asString(cr.id) ?? "",
        name: asString(cr.name) ?? "",
      };
    })
    .filter((c) => c.id);

  return { id, key, label, category: cats };
}

/**
 * GET /variants/attribute-definition
 * کاربرد:
 * - لیست ادمین (بدون noDetail یا با جستجو)
 * - هنگام ساخت محصول با categoryId (+ اختیاری noDetail=true)
 */
export async function fetchAttributeDefinitions(
  filters: AttributeDefinitionFilters = {},
): Promise<AttributeDefinition[]> {
  const categoryId = Array.isArray(filters.categoryId)
    ? filters.categoryId.join(",")
    : filters.categoryId;

  const { data } = await apiClient.get("/variants/attribute-definition", {
    params: {
      categoryId: categoryId || undefined,
      search: filters.search || undefined,
      noDetail:
        typeof filters.noDetail === "boolean" ? filters.noDetail : undefined,
    },
  });

  // ممکن است آرایه مستقیم یا object تکی/لیست باشد
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "id" in (data as object)
  ) {
    const one = mapAttributeDefinition(data);
    return one ? [one] : [];
  }

  return asArray(data)
    .map(mapAttributeDefinition)
    .filter((a): a is AttributeDefinition => a !== null);
}

/** POST /variants/attribute-definition — Admin */
export async function createAttributeDefinition(
  payload: AttributeDefinitionInput,
): Promise<void> {
  await apiClient.post("/variants/attribute-definition", payload);
}

/** PUT /variants/attribute-definition/{id} */
export async function updateAttributeDefinition(
  id: string,
  payload: AttributeDefinitionInput,
): Promise<void> {
  await apiClient.put(`/variants/attribute-definition/${id}`, payload);
}

/** DELETE /variants/attribute-definition/{id} — نباید به محصولی وصل باشد */
export async function deleteAttributeDefinition(id: string): Promise<void> {
  await apiClient.delete(`/variants/attribute-definition/${id}`);
}

function mapVariant(raw: unknown): ProductVariant | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  const productId = asString(r.productId);
  if (!id || !name || !productId) return null;

  const color = r.color as Record<string, unknown> | null | undefined;
  const discount = r.discount as Record<string, unknown> | null | undefined;
  const imagePath = asString(r.image);
  const attrs = asArray(r.attributes).map((a) => {
    const ar = (a ?? {}) as Record<string, unknown>;
    const def = (ar.attribute ?? {}) as Record<string, unknown>;
    return {
      id: asString(ar.id) ?? "",
      value: asString(ar.value) ?? "",
      attributeId: asString(ar.attributeId) ?? asString(def.id) ?? "",
      key: asString(def.key) ?? undefined,
      label: asString(def.label) ?? undefined,
    };
  });

  return {
    id,
    name,
    sku: asString(r.sku),
    price: asNumber(r.price),
    quantity: asNumber(r.quantity) ?? 0,
    colorId: asString(r.colorId),
    image: imagePath,
    imageUrl: imagePath ? resolveMediaUrl(imagePath) : null,
    saleCount: asNumber(r.saleCount) ?? 0,
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    discountId: asString(r.discountId),
    productId,
    color: color
      ? {
          id: asString(color.id) ?? "",
          name: asString(color.name) ?? "",
          hexCode: asString(color.hexCode) ?? "",
        }
      : null,
    attributes: attrs,
    discount: discount
      ? {
          id: asString(discount.id) ?? "",
          code: asString(discount.code) ?? undefined,
          isActive: Boolean(discount.isActive),
          value: asString(discount.value) ?? "",
          type: asString(discount.type) ?? "",
          startsAt: asString(discount.startsAt),
          endsAt: asString(discount.endsAt),
        }
      : null,
  };
}

/** GET /variants/{id} — id = productId */
export async function fetchProductVariants(
  productId: string,
): Promise<ProductVariant[]> {
  const { data } = await apiClient.get(`/variants/${productId}`);
  return asArray(data)
    .map(mapVariant)
    .filter((v): v is ProductVariant => v !== null);
}

/** POST /variants */
export async function createVariant(
  payload: CreateVariantInput,
): Promise<unknown> {
  const { data } = await apiClient.post("/variants", payload);
  return data;
}

/** PUT /variants/{variantId} */
export async function updateVariant(
  variantId: string,
  payload: UpdateVariantInput,
): Promise<unknown> {
  const { data } = await apiClient.put(`/variants/${variantId}`, payload);
  return data;
}

/** DELETE /variants/{variantId} */
export async function deleteVariant(variantId: string): Promise<void> {
  await apiClient.delete(`/variants/${variantId}`);
}
