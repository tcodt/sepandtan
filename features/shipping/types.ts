export type ShippingMethod = {
  id: string;
  name: string;
  isActive: boolean;
  isFreeMethod: boolean;
};

export type StoreShippingMethod = {
  id: string;
  description: string;
  phrase: string | null;
  isActive: boolean;
  minDays: number;
  maxDays: number;
  defaultPrice: number;
  storeId: string | null;
  shippingMethodId: string | null;
  createdAt: string;
};

export type ShippingRate = {
  id: string;
  price: number;
  deliveryMaxDays: number;
  provinceId: string;
  provinceName: string;
  createdAt: string;
};

export type ProvinceOption = {
  id: string;
  name: string;
};

export type CreateStoreShippingInput = {
  description: string;
  isActive?: boolean;
  phrase?: string | null;
  minDays?: number;
  maxDays?: number;
  defaultPrice?: number;
  /** الزامی برای create در عمل بک‌اند */
  shippingMethodId: string;
};

export type UpdateStoreShippingInput = {
  description: string;
  isActive?: boolean;
  phrase?: string | null;
  minDays?: number;
  maxDays?: number;
  defaultPrice?: number;
};

export type UpsertShippingRateInput = {
  price: number;
  deliveryMaxDays: number;
  storeShippingMethodId: string;
  provinceId: string;
};

/** گزینه ارسال قابل انتخاب در checkout — از GET /shipping/order/{provinceId} */
export type ShippingOption = {
  id: string;
  storeId: string;
  description: string;
  phrase: string | null;
  methodName: string | null;
  minDays: number;
  maxDays: number;
  defaultPrice: number;
  isActive: boolean;
};
