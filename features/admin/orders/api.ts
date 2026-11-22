import { apiClient } from "@/lib/api/client";
import type {
  AdminCheckoutItem,
  AdminOrdersFilters,
  AdminOrdersListResponse,
  AdminStoreOrderItem,
  OrderPaymentStatus,
  PaymentMethod,
  StoreOrderStatus,
  UpdateStoreOrderPayload,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const ORDER_STATUSES: StoreOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

const PAYMENT_STATUSES: OrderPaymentStatus[] = [
  "PENDING",
  "PAID",
  "REFUNDED",
  "FAILED",
];

const PAYMENT_METHODS: PaymentMethod[] = ["CARD", "WALLET", "COD", "ZARINPAL"];

function normalizeOrderStatus(raw: unknown): StoreOrderStatus {
  const s = asString(raw)?.toUpperCase();
  if (s && ORDER_STATUSES.includes(s as StoreOrderStatus)) {
    return s as StoreOrderStatus;
  }
  return "PENDING";
}

function normalizePaymentStatus(raw: unknown): OrderPaymentStatus | null {
  const s = asString(raw)?.toUpperCase();
  if (s && PAYMENT_STATUSES.includes(s as OrderPaymentStatus)) {
    return s as OrderPaymentStatus;
  }
  return null;
}

function normalizePaymentMethod(raw: unknown): PaymentMethod | null {
  const s = asString(raw)?.toUpperCase();
  if (s && PAYMENT_METHODS.includes(s as PaymentMethod)) {
    return s as PaymentMethod;
  }
  return null;
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of [
    "orders",
    "order",
    "checkouts",
    "checkout",
    "data",
    "items",
    "results",
  ]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function paginationOf(
  root: Record<string, unknown>,
  page: number,
  limit: number,
  itemCount: number,
) {
  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total, itemCount);
  const totalPages =
    num(pag.totalPages, 0) || Math.max(1, Math.ceil(total / limit) || 1);
  return {
    page: num(pag.page, page) || page,
    limit,
    total,
    totalPages,
  };
}

function buildParams(
  filters: AdminOrdersFilters,
): Record<string, string | number> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const params: Record<string, string | number> = {
    page,
    limit,
    order: filters.order ?? "desc",
  };

  if (filters.status && filters.status !== "ALL") {
    params.status = filters.status;
  }
  if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
    params.paymentStatus = filters.paymentStatus;
  }
  if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
    params.paymentMethod = filters.paymentMethod;
  }
  if (filters.orderNumber?.trim())
    params.orderNumber = filters.orderNumber.trim();
  if (filters.trackingCode?.trim()) {
    params.trackingCode = filters.trackingCode.trim();
  }
  if (filters.checkoutNumber?.trim()) {
    params.checkoutNumber = filters.checkoutNumber.trim();
  }
  if (filters.paymentRef?.trim()) params.paymentRef = filters.paymentRef.trim();
  if (filters.userId?.trim()) params.userId = filters.userId.trim();
  if (filters.storeId?.trim()) params.storeId = filters.storeId.trim();

  return params;
}

function mapStoreOrder(raw: unknown): AdminStoreOrderItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? {}) as Record<string, unknown>;
  const store = (r.store ?? {}) as Record<string, unknown>;

  return {
    id,
    orderNumber: asString(r.orderNumber),
    status: normalizeOrderStatus(r.status),
    paymentStatus: normalizePaymentStatus(r.paymentStatus),
    storeId: asString(r.storeId) ?? asString(store.id),
    storeName: asString(r.storeName) ?? asString(store.name),
    userId: asString(r.userId) ?? asString(user.id),
    userName: asString(r.userName) ?? asString(user.name),
    trackingCode: asString(r.trackingCode),
    subtotal: asString(r.subtotal),
    totalPrice: asString(r.totalPrice) ?? asString(r.total),
    shippingCost: asString(r.shippingCost),
    discountAmount: asString(r.discountAmount),
    createdAt: asString(r.createdAt),
  };
}

function mapCheckout(raw: unknown): AdminCheckoutItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? {}) as Record<string, unknown>;

  return {
    id,
    checkoutNumber: asString(r.checkoutNumber) ?? asString(r.number),
    paymentStatus: normalizePaymentStatus(r.paymentStatus),
    paymentMethod: normalizePaymentMethod(r.paymentMethod),
    paymentRef: asString(r.paymentRef) ?? asString(r.refId),
    userId: asString(r.userId) ?? asString(user.id),
    userName: asString(r.userName) ?? asString(user.name),
    totalPrice: asString(r.totalPrice) ?? asString(r.total),
    createdAt: asString(r.createdAt),
  };
}

/** GET /orders/admin/order — سفارش‌های فروشگاهی */
export async function fetchAdminStoreOrders(
  filters: AdminOrdersFilters = {},
): Promise<AdminOrdersListResponse<AdminStoreOrderItem>> {
  const params = buildParams(filters);
  const { data } = await apiClient.get("/orders/admin/order", { params });
  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapStoreOrder)
    .filter((x): x is AdminStoreOrderItem => x !== null);

  return {
    data: items,
    pagination: paginationOf(
      root,
      Number(params.page),
      Number(params.limit),
      items.length,
    ),
  };
}

/** GET /orders/admin — تسویه‌حساب‌ها */
export async function fetchAdminCheckouts(
  filters: AdminOrdersFilters = {},
): Promise<AdminOrdersListResponse<AdminCheckoutItem>> {
  const params = buildParams(filters);
  const { data } = await apiClient.get("/orders/admin", { params });
  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapCheckout)
    .filter((x): x is AdminCheckoutItem => x !== null);

  return {
    data: items,
    pagination: paginationOf(
      root,
      Number(params.page),
      Number(params.limit),
      items.length,
    ),
  };
}

/** PUT /orders/edit/{id} — updateStoreOrderDto */
export async function updateAdminStoreOrder(
  id: string,
  payload: UpdateStoreOrderPayload,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!payload.status) throw new Error("وضعیت الزامی است");

  const body: Record<string, unknown> = { status: payload.status };
  if (payload.storeId?.trim()) body.storeId = payload.storeId.trim();

  await apiClient.put(`/orders/edit/${encodeURIComponent(id)}`, body);
}
