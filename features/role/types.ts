export type ProvinceItem = {
  id: string;
  name: string;
};

export type CityItem = {
  id: string;
  name: string;
  provinceId: string;
};

export type CreateStorePayload = {
  name: string;
  slug: string;
  businessType?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type RoleRequestResult = {
  success?: boolean;
  id?: string;
  status?: string;
  [key: string]: unknown;
};

export type SpecialtySelectorItem = {
  id: string;
  title: string;
  slug: string;
};

export type CreateCoachPayload = {
  title?: string;
  slug?: string;
  headline?: string;
  bio?: string;
  experienceYears?: string;
  instagram?: string;
  maxClients?: number;
  isAcceptingClients?: boolean;
  nationalId?: string;
  provinceId?: string;
  cityId?: string;
  addressId?: string;
  banner?: string[];
  /** فقط فرانت — بعد از POST برای PATCH /coach/specialty */
  specialtyIds?: string[];
};
