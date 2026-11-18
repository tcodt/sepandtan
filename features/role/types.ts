export type CreateCoachPayload = {
  isAcceptingClients?: boolean;
  headline?: string;
  bio?: string;
  maxClients?: number;
  experienceYears?: string | number;
  nationalId?: string;
  instagram?: string;
  address?: string;
  /** Display title — defaults to user name */
  title?: string;
  /** URL slug — auto-generated if omitted */
  slug?: string;
};

export type CreateStorePayload = {
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessType?: "LEGAL" | "INDIVIDUAL";
};

export type RoleRequestResult = {
  id?: string;
  status?: string;
  success?: boolean;
  [key: string]: unknown;
};
