"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ShoppingCartIcon } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { items } from "@/lib/products";

const categories = [
  { id: "all", name: "همه" },
  { id: "apparel", name: "لباس ورزشی" },
  { id: "equipment", name: "تجهیزات" },
  { id: "nutrition", name: "مکمل‌ها" },
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {filteredItems.length > 0 &&
              filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-3 flex flex-col gap-4 md:gap-10"
                >
                  <CardHeader className="h-32 md:h-52 rounded-xl mb-4">
                    <Link href={`/store/${item.id}`} className="w-full h-full">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={200}
                        height={200}
                        className="rounded-xl object-contain mx-auto"
                      />
                    </Link>
                  </CardHeader>
                  <CardTitle className="line-clamp-1">
                    <Link
                      href={`/store/${item.id}`}
                      className="hover:underline"
                    >
                      {item.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {item.description}
                  </CardDescription>
                  <CardAction className="flex flex-row md:flex-col-reverse md:gap-4 md:items-end items-center justify-between w-full">
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
                    <CardDescription>
                      {item.price.toLocaleString()} تومان
                    </CardDescription>
                  </CardAction>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
