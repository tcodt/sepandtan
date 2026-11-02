"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import { cartToValidatePayload, validateDiscountCode } from "./api";
import type { Cart } from "@/features/cart/types";

export function useValidateDiscount() {
  return useMutation({
    mutationFn: ({ code, cart }: { code: string; cart: Cart }) =>
      validateDiscountCode(cartToValidatePayload(code.trim(), cart)),
    onError: (e) => toast.error(getErrorMessage(e, "کد تخفیف معتبر نیست")),
  });
}
