export type CreateCoachPayload = {
  isAcceptingClients?: boolean;
  headline?: string;
  bio?: string;
  maxClients?: number;
  experienceYears?: string;
  nationalId?: string;
  instagram?: string;
  address?: string;
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
