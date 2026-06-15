"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Product } from "@/lib/products-type";
import { ShoppingCartIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ProductGridProps = {
  items: Product[];
};

const ProductGrid = ({ items }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      {items.length > 0 &&
        items.map((item) => (
          <Card key={item.id} className="p-3 flex flex-col gap-4 md:gap-10">
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
              <Link href={`/store/${item.id}`} className="hover:underline">
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
                <Link
                  href={`/store/${item.id}`}
                  className="flex items-center gap-2"
                >
                  افزودن به سبد خرید
                  <ShoppingCartIcon size={25} />
                </Link>
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
  );
};

export default ProductGrid;
