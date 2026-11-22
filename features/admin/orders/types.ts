export type OrderPaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export type StoreOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentMethod = "CARD" | "WALLET" | "COD" | "ZARINPAL";

/** ردیف سفارش فروشگاهی — از /orders/admin/order */
export type AdminStoreOrderItem = {
  id: string;
  orderNumber: string | null;
  status: StoreOrderStatus;
  paymentStatus: OrderPaymentStatus | null;
  storeId: string | null;
  storeName: string | null;
  userId: string | null;
  userName: string | null;
  trackingCode: string | null;
  subtotal: string | null;
  totalPrice: string | null;
  shippingCost: string | null;
  discountAmount: string | null;
  createdAt: string | null;
};

/** تسویه‌حساب — از /orders/admin */
export type AdminCheckoutItem = {
  id: string;
  checkoutNumber: string | null;
  paymentStatus: OrderPaymentStatus | null;
  paymentMethod: PaymentMethod | null;
  paymentRef: string | null;
  userId: string | null;
  userName: string | null;
  totalPrice: string | null;
  createdAt: string | null;
};

export type AdminOrdersFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: StoreOrderStatus | "ALL";
  paymentStatus?: OrderPaymentStatus | "ALL";
  paymentMethod?: PaymentMethod | "ALL";
  orderNumber?: string;
  trackingCode?: string;
  checkoutNumber?: string;
  paymentRef?: string;
  userId?: string;
  storeId?: string;
};

export type AdminOrdersListResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** PUT /orders/edit/{id} */
export type UpdateStoreOrderPayload = {
  status: StoreOrderStatus;
  storeId?: string;
};
