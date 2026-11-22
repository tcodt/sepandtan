export type CreateCoachPayload = {
  title?: string;
  slug?: string;
  headline?: string;
  bio?: string;
  /** ISO date string — CreateCoachDto.experienceYears (format: date) */
  experienceYears?: string;
  instagram?: string;
  maxClients?: number;
  isAcceptingClients?: boolean;
  nationalId?: string;
  provinceId?: string;
  cityId?: string;
  addressId?: string;
  /** فقط اگر مدیا از قبل آپلود شده باشد */
  banner?: string[];
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

export type ProvinceItem = {
  id: string;
  name: string;
};

export type CityItem = {
  id: string;
  name: string;
  provinceId: string;
};
