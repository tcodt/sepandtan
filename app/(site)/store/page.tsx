"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ShoppingCartIcon } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const categories = [
  { id: "all", name: "همه" },
  { id: "apparel", name: "لباس ورزشی" },
  { id: "equipment", name: "تجهیزات" },
  { id: "nutrition", name: "مکمل‌ها" },
];

const items = [
  {
    id: 1,
    category: "apparel",
    name: "تی‌شرت ورزشی آبی",
    price: 150000,
    image: "/images/store/product-1.webp",
  },
  {
    id: 2,
    category: "apparel",
    name: "تی‌شرت ورزشی سیاه",
    price: 160000,
    image: "/images/store/product-2.webp",
  },
  {
    id: 3,
    category: "apparel",
    name: "تی‌شرت ورزشی قرمز",
    price: 155000,
    image: "/images/store/product-3.jpg",
  },
  {
    id: 4,
    category: "apparel",
    name: "تی‌شرت ورزشی سفید",
    price: 145000,
    image: "/images/store/product-4.jpg",
  },
  {
    id: 5,
    category: "apparel",
    name: "تی‌شرت ورزشی خاکستری",
    price: 150000,
    image: "/images/store/product-5.jpg",
  },
  {
    id: 6,
    category: "apparel",
    name: "تی‌شرت ورزشی سبز",
    price: 155000,
    image: "/images/store/product-6.jpg",
  },
  {
    id: 7,
    category: "nutrition",
    name: "پروتئین وی",
    price: 450000,
    image: "/images/store/supplement-1.webp",
  },
  {
    id: 8,
    category: "nutrition",
    name: "کراتین مونوهیدرات",
    price: 280000,
    image: "/images/store/supplement-2.webp",
  },
  {
    id: 9,
    category: "nutrition",
    name: "BCAA",
    price: 320000,
    image: "/images/store/supplement-3.webp",
  },
  {
    id: 10,
    category: "nutrition",
    name: "ویتامین مولتی",
    price: 200000,
    image: "/images/store/supplement-4.webp",
  },
  {
    id: 11,
    category: "nutrition",
    name: "اسپیرولینا",
    price: 250000,
    image: "/images/store/supplement-5.webp",
  },
  {
    id: 12,
    category: "nutrition",
    name: "آمینو اسید",
    price: 380000,
    image: "/images/store/supplement-6.avif",
  },
  {
    id: 13,
    category: "equipment",
    name: "دمبل 10 کیلوگرمی",
    price: 350000,
    image: "/images/store/dumbbell-1.avif",
  },
  {
    id: 14,
    category: "equipment",
    name: "دمبل 20 کیلوگرمی",
    price: 600000,
    image: "/images/store/dumbbell-2.webp",
  },
  {
    id: 15,
    category: "equipment",
    name: "دمبل 30 کیلوگرمی",
    price: 850000,
    image: "/images/store/dumbbell-4.jpg",
  },
];

export default function Store() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const router = useRouter();

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <section className="p-4 md:p-8">
      <div>
        <div className="flex flex-row justify-between items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-foreground">
              فروشگاه
            </h2>
            <p className="text-muted-foreground mb-6">
              محصولات و خدمات ما را در اینجا پیدا کنید.
            </p>
          </div>
          <Button variant={"ghost"} size={"icon-lg"} onClick={handleGoBack}>
            <ArrowLeftIcon />
          </Button>
        </div>

        {/* Categories */}
        <div className="mt-4 flex items-center flex-row flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              size={"sm"}
              variant={selectedCategory === category.id ? "default" : "outline"}
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Items */}
        <div className="mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredItems.length > 0 &&
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-xl p-3 bg-muted flex flex-col gap-8 md:gap-10"
                >
                  <div className="h-40 md:h-80 rounded-xl">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={300}
                      height={300}
                      className="rounded-xl object-contain"
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="flex flex-row md:flex-col-reverse md:gap-4 md:items-end items-center justify-between">
                    <Button
                      className="w-full mt-2 hidden md:flex items-center gap-2"
                      size={"lg"}
                    >
                      افزودن به سبد خرید
                      <ShoppingCartIcon size={25} />
                    </Button>
                    <Button className="md:hidden" variant={"default"}>
                      <ShoppingCartIcon />
                    </Button>
                    <p className="text-sm md:text-base text-muted-foreground font-bold line-clamp-1">
                      {item.price.toLocaleString()} تومان
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
