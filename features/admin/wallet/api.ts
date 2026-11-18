import { apiClient } from "@/lib/api/client";
import type {
  AdminTransactionsFilters,
  AdminWalletItem,
  AdminWalletsFilters,
  AdminWalletTransaction,
  PaginatedResult,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object" && "value" in v) {
    return asString((v as { value: unknown }).value);
  }
  return null;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function money(v: unknown): string {
  const s = asString(v);
  if (s) return s;
  const n = num(v, 0);
  return String(n);
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of [
    "wallets",
    "wallet",
    "transactions",
    "transaction",
    "data",
    "items",
    "results",
  ]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function paginate(
  root: Record<string, unknown>,
  itemsLen: number,
  page: number,
  limit: number,
) {
  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total, itemsLen);
  const totalPages =
    num(pag.totalPages, 0) || Math.max(1, Math.ceil(total / limit));
  const currentPage = num(pag.page, page) || page;
  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
}

function mapWallet(raw: unknown): AdminWalletItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const userId =
    asString(r.userId) || asString((r.user as Record<string, unknown>)?.id);
  if (!id || !userId) return null;

  const user = (r.user ?? {}) as Record<string, unknown>;

  return {
    id,
    userId,
    userName: asString(user.name) || asString(r.userName),
    userPhone: asString(user.phone) || asString(r.phone),
    balance: money(r.balance),
    pendingBalance: money(r.pendingBalance),
    withdrawBalance: money(r.withdrawBalance),
    frozenBalance: money(r.frozenBalance),
    isPlatform: r.isPlatform === true,
    createdAt: asString(r.createdAt) || "",
    updatedAt: asString(r.updatedAt) || "",
  };
}

function mapTx(raw: unknown): AdminWalletTransaction | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? {}) as Record<string, unknown>;
  const type = (asString(r.type) || "PAYMENT").toUpperCase();
  const status = (asString(r.status) || "PENDING").toUpperCase();

  return {
    id,
    userId: asString(r.userId) || asString(user.id),
    userName: asString(user.name) || asString(r.userName),
    type,
    status,
    amount: money(r.amount),
    trackingCode: asString(r.trackingCode),
    description: asString(r.description) || asString(r.note),
    createdAt: asString(r.createdAt) || "",
    isWithdraw: type === "WITHDRAW" || type.includes("WITHDRAW"),
  };
}

/** GET /wallet/admin/all */
export async function fetchAdminWallets(
  filters: AdminWalletsFilters = {},
): Promise<PaginatedResult<AdminWalletItem>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const { data } = await apiClient.get("/wallet/admin/all", {
    params: {
      page,
      limit,
      order: filters.order ?? "desc",
      userId: filters.userId || undefined,
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapWallet)
    .filter((x): x is AdminWalletItem => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter((w) => {
      const hay =
        `${w.userName ?? ""} ${w.userPhone ?? ""} ${w.userId}`.toLowerCase();
      return hay.includes(q);
    });
  }

  return { data: items, pagination: paginate(root, items.length, page, limit) };
}

/** GET /wallet/admin/transactions */
export async function fetchAdminTransactions(
  filters: AdminTransactionsFilters = {},
): Promise<PaginatedResult<AdminWalletTransaction>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const { data } = await apiClient.get("/wallet/admin/transactions", {
    params: {
      page,
      limit,
      order: filters.order ?? "desc",
      type: filters.type || undefined,
      status: filters.status || undefined,
      trackingCode: filters.trackingCode || undefined,
      userId: filters.userId || undefined,
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapTx)
    .filter((x): x is AdminWalletTransaction => x !== null);

  return { data: items, pagination: paginate(root, items.length, page, limit) };
}

export async function completeTransaction(id: string): Promise<void> {
  await apiClient.put(
    `/wallet/admin/transactions/${encodeURIComponent(id)}/complete`,
  );
}

export async function failTransaction(id: string): Promise<void> {
  await apiClient.put(
    `/wallet/admin/transactions/${encodeURIComponent(id)}/fail`,
  );
}

export async function approveWithdraw(id: string): Promise<void> {
  await apiClient.put(
    `/wallet/admin/withdraw/${encodeURIComponent(id)}/approve`,
  );
}

export async function rejectWithdraw(id: string): Promise<void> {
  await apiClient.put(
    `/wallet/admin/withdraw/${encodeURIComponent(id)}/reject`,
  );
}
