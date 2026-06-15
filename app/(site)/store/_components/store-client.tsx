"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Category from "./category";
import { Product } from "@/lib/products-type";
import ProductGrid from "./product-grid";

type StoreClientProps = {
  initialItems: Product[];
};

const StoreClient = ({ initialItems }: StoreClientProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const router = useRouter();

  const filteredItems =
    selectedCategory === "all"
      ? initialItems
      : initialItems.filter((item) => item.category === selectedCategory);

  const handleBack = () => {
    router.back();
  };

  return (
    <main className="p-4 md:p-8">
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
          <Button variant={"ghost"} size={"icon-lg"} onClick={handleBack}>
            <ArrowLeftIcon />
          </Button>
        </div>

        <Category
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <div className="mt-8">
          <ProductGrid items={filteredItems} />
        </div>
      </div>
    </main>
  );
};

export default StoreClient;
