export type CartVariantAttr = {
  id: string;
  value: string;
  key?: string;
  label?: string;
};

export type CartVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  colorName: string | null;
  attributes: CartVariantAttr[];
  discount: {
    id: string;
    isActive: boolean;
    value: string;
    type: string;
    endsAt: string | null;
  } | null;
};

export type CartProduct = {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  storeName: string;
  storeSlug: string;
  commissionRate: string;
  imageUrl: string | null;
  imagePath: string | null;
};

export type CartItem = {
  id: string;
  quantity: number;
  createdAt: string;
  variantId: string;
  product: CartProduct;
  variant: CartVariant;
  totalPrice: number;
  totalDiscount: number;
};

export type StoreCartGroup = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  commissionRate: string;
  items: CartItem[];
};

export type Cart = {
  totalItems: number;
  totalPrice: number;
  stores: StoreCartGroup[];
};

export type AddToCartInput = {
  productId: string;
  variantId: string;
  quantity?: number;
};

export type UpdateCartItemInput = {
  quantity: number;
};
