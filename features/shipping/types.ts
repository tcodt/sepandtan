export type ShippingOption = {
  id: string;
  storeId: string;
  shippingMethodId: string;
  isActive: boolean;
  description: string | null;
  phrase: string | null;
  minDays: number;
  maxDays: number;
  defaultPrice: number;
  /** نام روش پایه اگر بک‌اند nested بفرستد */
  methodName: string | null;
};
