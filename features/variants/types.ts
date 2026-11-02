export type AttributeCategoryRef = {
  id: string;
  name: string;
};

export type AttributeDefinition = {
  id: string;
  key: string;
  label: string;
  category: AttributeCategoryRef[];
};

export type AttributeDefinitionInput = {
  key: string;
  label: string;
  categoryIds?: string[];
};

export type AttributeDefinitionFilters = {
  /** comma-separated یا array — در api به query تبدیل می‌شود */
  categoryId?: string | string[];
  search?: string;
  /** true = لیست سبک بدون جزئیات */
  noDetail?: boolean;
};

export type AttributeValueInput = {
  attributeId: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  quantity: number;
  colorId: string | null;
  image: string | null;
  imageUrl: string | null;
  saleCount: number;
  createdAt: string;
  updatedAt: string;
  discountId: string | null;
  productId: string;
  color: { id: string; name: string; hexCode: string } | null;
  attributes: Array<{
    id: string;
    value: string;
    attributeId: string;
    key?: string;
    label?: string;
  }>;
  discount: {
    id: string;
    code?: string;
    isActive: boolean;
    value: string;
    type: string;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
};

export type CreateVariantInput = {
  name: string;
  quantity: number;
  productId: string;
  price?: number;
  colorId?: string;
  image?: string; // relative path
  discountId?: string;
  attributes?: AttributeValueInput[];
};

export type UpdateVariantInput = {
  name?: string;
  quantity?: number;
  price?: number;
  colorId?: string;
  image?: string;
  discountId?: string;
  attributes?: AttributeValueInput[];
};
