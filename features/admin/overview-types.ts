export type RoleBreakdown = {
  USER: number;
  COACH: number;
  STORE: number;
  ADMIN: number;
  SUPERADMIN: number;
  AUTHOR: number;
  other: number;
};

export type StatusBreakdown = {
  ACTIVE: number;
  SUSPENDED: number;
  DELETED: number;
  other: number;
};

export type ProductStatusBreakdown = {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  featured: number;
  total: number;
};

export type TicketStatsNormalized = {
  total: number;
  pending: number;
  open: number;
  closed: number;
  raw: Record<string, number>;
};

export type ReportStatsNormalized = {
  total: number;
  pending: number;
  resolved: number;
  raw: Record<string, number>;
};

export type AdminOverviewSnapshot = {
  usersTotal: number;
  roleBreakdown: RoleBreakdown;
  statusBreakdown: StatusBreakdown;
  pendingCoaches: number;
  pendingStores: number;
  products: ProductStatusBreakdown;
  tickets: TicketStatsNormalized;
  reports: ReportStatsNormalized;
  fetchedAt: string;
  partialErrors: string[];
};
