/** بدنه validate طبق swagger — stores از ساختار سبد ساخته می‌شود */
export type ValidateDiscountInput = {
  code: string;
  stores: Array<{
    storeId: string;
    storeName: string;
    storeSlug: string;
    commissionRate: string;
    carts: Array<{
      id: string;
      quantity: number;
      createdAt: string;
      variantId: string;
      product: {
        id: string;
        storeId: string;
        title: string;
        slug: string;
        store: {
          commissionRate: string;
          name: string;
          slug: string;
        };
        images: Array<{ alt?: string; url: string }>;
      };
      variant: {
        name: string;
        id: string;
        color?: { name: string } | null;
        price: string;
        sku?: string;
        attributes?: string[];
        discount?: {
          isActive: boolean;
          value: string;
          id: string;
          type: string;
          endsAt?: string;
        } | null;
      };
      totalPrice: number;
      totalDiscount: number;
    }>;
  }>;
};
