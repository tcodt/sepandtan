import { apiClient } from "@/lib/api/client";
import { asArray, asString, mapPagination } from "@/features/catalog/utils";
import type {
  CheckoutDetail,
  CheckoutListResponse,
  CheckoutSummary,
  CreateCheckoutInput,
  MyCheckoutsFilters,
  Order,
  StoreOrdersFilters,
  UpdateStoreOrderInput,
} from "./types";

function mapCheckoutSummary(raw: unknown): CheckoutSummary | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  return {
    id,
    checkoutNumber: asString(r.checkoutNumber) ?? "",
    createdAt: asString(r.createdAt) ?? "",
    discountAmount: asString(r.discountAmount) ?? "0",
    paymentMethod: asString(r.paymentMethod),
    paymentStatus: asString(r.paymentStatus) ?? "PENDING",
    status: asString(r.status) ?? "PENDING",
    paymentRef: asString(r.paymentRef),
    totalAmount: asString(r.totalAmount) ?? "0",
    userId: asString(r.userId) ?? "",
  };
}

function mapOrder(raw: unknown): Order | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const items = asArray(r.items).map((it) => {
    const ir = (it ?? {}) as Record<string, unknown>;
    return {
      sku: asString(ir.sku) ?? "",
      name: asString(ir.name) ?? "",
      price: asString(ir.price) ?? "0",
      originalPrice: asString(ir.originalPrice) ?? "0",
      total: asString(ir.total) ?? "0",
      quantity: Number(ir.quantity) || 0,
      returnedQty: Number(ir.returnedQty) || 0,
      attributes: asArray(ir.attributes).map((a) => {
        const ar = (a ?? {}) as Record<string, unknown>;
        return {
          key: asString(ar.key) ?? "",
          label: asString(ar.label) ?? "",
          value: asString(ar.value) ?? "",
        };
      }),
      colorName: asString(ir.colorName),
      colorHex: asString(ir.colorHex),
      productId: asString(ir.productId) ?? "",
    };
  });

  return {
    id,
    orderNumber: asString(r.orderNumber) ?? "",
    status: asString(r.status) ?? "PENDING",
    shippingCost: asString(r.shippingCost) ?? "0",
    shippingName: asString(r.shippingName),
    storeName: asString(r.storeName) ?? "",
    commission: asString(r.commission) ?? "0",
    commissionAmount: asString(r.commissionAmount) ?? "0",
    subtotal: asString(r.subtotal) ?? "0",
    totalPrice: asString(r.totalPrice) ?? "0",
    discountAmount: asString(r.discountAmount) ?? "0",
    note: asString(r.note),
    trackingCode: asString(r.trackingCode),
    taxAmount: asString(r.taxAmount) ?? "0",
    checkoutId: asString(r.checkoutId) ?? "",
    storeId: asString(r.storeId) ?? "",
    userId: asString(r.userId) ?? "",
    deliveredAt: asString(r.deliveredAt),
    cancelledAt: asString(r.cancelledAt),
    returnDeadline: asString(r.returnDeadline),
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    items: items.length ? items : undefined,
  };
}

function mapCheckoutDetail(raw: unknown): CheckoutDetail | null {
  const base = mapCheckoutSummary(raw);
  if (!base) return null;
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    ...base,
    commissionAmount: asString(r.commissionAmount) ?? undefined,
    salesProfit: asString(r.salesProfit) ?? undefined,
    taxAmount: asString(r.taxAmount) ?? undefined,
    shippingName: asString(r.shippingName) ?? undefined,
    shippingPhone: asString(r.shippingPhone) ?? undefined,
    shippingCity: asString(r.shippingCity) ?? undefined,
    shippingProvince: asString(r.shippingProvince) ?? undefined,
    shippingAddress: asString(r.shippingAddress) ?? undefined,
    shippingPostal: asString(r.shippingPostal) ?? undefined,
    addressId: asString(r.addressId) ?? undefined,
    orders: asArray(r.orders)
      .map(mapOrder)
      .filter((o): o is Order => o !== null),
  };
}

/** POST /orders — ثبت تسویه حساب */
export async function createCheckout(
  payload: CreateCheckoutInput,
): Promise<CheckoutSummary | Record<string, unknown>> {
  const body = {
    addressId: payload.addressId,
    orders: payload.orders,
    discountId: payload.discountId ?? null,
    paymentMethod: payload.paymentMethod,
  };
  const { data } = await apiClient.post("/orders", body);
  return mapCheckoutSummary(data) ?? (data as Record<string, unknown>);
}

/** PATCH /orders/{id} — پرداخت سفارش */
export async function payCheckout(checkoutId: string): Promise<unknown> {
  const { data } = await apiClient.patch(`/orders/${checkoutId}`);
  return data;
}

/** GET /orders/me */
export async function fetchMyCheckouts(
  filters: MyCheckoutsFilters = {},
): Promise<CheckoutListResponse> {
  const { data } = await apiClient.get("/orders/me", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      order: filters.order ?? "desc",
      paymentStatus: filters.paymentStatus,
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      checkoutNumber: filters.checkoutNumber,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.checkouts ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    checkouts: list
      .map(mapCheckoutSummary)
      .filter((c): c is CheckoutSummary => c !== null),
  };
}

/** GET /orders/id/{id} */
export async function fetchCheckoutById(
  id: string,
): Promise<CheckoutDetail | null> {
  const { data } = await apiClient.get(`/orders/id/${id}`);
  return mapCheckoutDetail(data);
}

/** GET /orders/admin */
export async function fetchAdminCheckouts(
  filters: MyCheckoutsFilters = {},
): Promise<CheckoutListResponse> {
  const { data } = await apiClient.get("/orders/admin", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
      paymentStatus: filters.paymentStatus,
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      checkoutNumber: filters.checkoutNumber,
      userId: (filters as { userId?: string }).userId,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.checkouts ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    checkouts: list
      .map(mapCheckoutSummary)
      .filter((c): c is CheckoutSummary => c !== null),
  };
}

/** GET /orders/store/{storeId} — برای Seller آینده */
export async function fetchStoreOrders(
  storeId: string,
  filters: StoreOrdersFilters = {},
): Promise<{ pagination: ReturnType<typeof mapPagination>; orders: Order[] }> {
  const { data } = await apiClient.get(`/orders/store/${storeId}`, {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
      paymentStatus: filters.paymentStatus,
      orderNumber: filters.orderNumber,
      trackingCode: filters.trackingCode,
      userId: filters.userId,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.orders ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    orders: list.map(mapOrder).filter((o): o is Order => o !== null),
  };
}

/** PUT /orders/edit/{id} — آپدیت وضعیت سفارش (Admin & Store) */
export async function updateStoreOrderStatus(
  orderId: string,
  payload: UpdateStoreOrderInput,
): Promise<void> {
  await apiClient.put(`/orders/edit/${orderId}`, payload);
}

/** DELETE /orders/{id} */
export async function deleteCheckout(id: string): Promise<void> {
  await apiClient.delete(`/orders/${id}`);
}
