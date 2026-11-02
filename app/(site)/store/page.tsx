import type { Metadata } from "next";
import StoreClient from "@/components/store/store-client";

export const metadata: Metadata = {
  title: "سپندتن | فروشگاه",
  description:
    "بهترین محصولات ورزشی، تجهیزات و مکمل‌ها را با بهترین قیمت پیدا کنید.",
};

export default function StorePage() {
  return <StoreClient />;
}
