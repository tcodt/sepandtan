export type StoreRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminStoreItem = {
  id: string;
  name: string;
  slug?: string | null;
  email?: string | null;
  phone?: string | null;
  status: StoreRequestStatus | string;
  statusReason?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  businessType?: string | null;
  ownerName?: string | null;
  ownerId?: string | null;
  createdAt?: string;
  source: "store" | "request";
};

export type PaginationMeta = {
  nextPage: number | null;
  prevPage: number | null;
  total: number;
};

export type AdminStoresResponse = {
  pagination: PaginationMeta;
  data: AdminStoreItem[];
};

export type AdminStoresFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: StoreRequestStatus | "ALL";
  search?: string;
};

export type UpdateStoreByAdminPayload = {
  status: StoreRequestStatus;
  statusReason?: string | null;
};
