import { items } from "@/lib/products";
import { Metadata } from "next";
import { Product } from "@/lib/products-type";
import StoreClient from "@/components/store/store-client";

export const metadata: Metadata = {
  title: "سپندتن | فروشگاه",
  description:
    "بهترین محصولات ورزشی، تجهیزات و مکمل‌ها را با بهترین قیمت پیدا کنید.",
};

export default function Store() {
  return <StoreClient initialItems={items as Product[]} />;
}
