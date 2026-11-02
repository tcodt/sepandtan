import type { PaginationMeta } from "@/features/catalog/types";

export type PaymentMethod = "card" | "wallet" | "cod" | "zarinpal";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | string;

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED" | string;

export type CheckoutOrderLine = {
  storeId: string;
  shippingId: string; // storeShippingMethod id
  shippingName: string;
  shippingCost: string;
  shippingTime: number;
  note: string;
};

export type CreateCheckoutInput = {
  addressId?: string;
  orders: CheckoutOrderLine[];
  discountId?: string | null;
  paymentMethod: PaymentMethod;
};

export type CheckoutSummary = {
  id: string;
  checkoutNumber: string;
  createdAt: string;
  discountAmount: string;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  status: string;
  paymentRef: string | null;
  totalAmount: string;
  userId: string;
};

export type OrderItem = {
  sku: string;
  name: string;
  price: string;
  originalPrice: string;
  total: string;
  quantity: number;
  returnedQty: number;
  attributes: Array<{ key: string; label: string; value: string }>;
  colorName: string | null;
  colorHex: string | null;
  productId: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  shippingCost: string;
  shippingName: string | null;
  storeName: string;
  commission: string;
  commissionAmount: string;
  subtotal: string;
  totalPrice: string;
  discountAmount: string;
  note: string | null;
  trackingCode: string | null;
  taxAmount: string;
  checkoutId: string;
  storeId: string;
  userId: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  returnDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type CheckoutDetail = CheckoutSummary & {
  commissionAmount?: string;
  salesProfit?: string;
  taxAmount?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingAddress?: string;
  shippingPostal?: string;
  addressId?: string;
  orders: Order[];
};

export type CheckoutListResponse = {
  pagination: PaginationMeta;
  checkouts: CheckoutSummary[];
};

export type MyCheckoutsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  paymentStatus?: PaymentStatus;
  status?: string;
  paymentMethod?: string;
  checkoutNumber?: string;
};

export type StoreOrdersFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  paymentStatus?: PaymentStatus;
  orderNumber?: string;
  trackingCode?: string;
  userId?: string;
};

export type UpdateStoreOrderInput = {
  status: OrderStatus;
  storeId: string;
};
