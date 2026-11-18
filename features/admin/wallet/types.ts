export type AdminWalletItem = {
  id: string;
  userId: string;
  userName: string | null;
  userPhone: string | null;
  balance: string;
  pendingBalance: string;
  withdrawBalance: string;
  frozenBalance: string;
  isPlatform: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WalletTxStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | string;

export type WalletTxType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "PAYMENT"
  | "REFUND"
  | "COMMISSION"
  | string;

export type AdminWalletTransaction = {
  id: string;
  userId: string | null;
  userName: string | null;
  type: WalletTxType;
  status: WalletTxStatus;
  amount: string;
  trackingCode: string | null;
  description: string | null;
  createdAt: string;
  /** برای withdraw approve/reject همین id استفاده می‌شود */
  isWithdraw: boolean;
};

export type AdminWalletsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  userId?: string;
  search?: string;
};

export type AdminTransactionsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  type?: string;
  status?: string;
  trackingCode?: string;
  userId?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
