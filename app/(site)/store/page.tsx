import { items } from "@/lib/products";
import { Metadata } from "next";
import StoreClient from "./_components/store-client";
import { Product } from "@/lib/products-type";

export const metadata: Metadata = {
  title: "سپندتن | فروشگاه",
  description:
    "بهترین محصولات ورزشی، تجهیزات و مکمل‌ها را با بهترین قیمت پیدا کنید.",
};

export default function Store() {
  return <StoreClient initialItems={items as Product[]} />;
}
