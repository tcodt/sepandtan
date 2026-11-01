export type Address = {
  id: string;
  title?: string | null;
  fullName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  address: string;
  postalCode?: string | null;
  isDefault: boolean;
  /** اگر بک‌اند nested برگرداند */
  provinceName?: string | null;
  cityName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAddressInput = {
  title?: string;
  fullName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  address: string;
  postalCode?: string;
  isDefault?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;
