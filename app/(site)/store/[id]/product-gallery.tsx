/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";

export default function ProductGallery({ product }: any) {
  return (
    <Card className="p-6 rounded-2xl border-none shadow-none bg-transparent">
      <div className="relative w-full aspect-square">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain rounded-xl"
        />
      </div>
    </Card>
  );
}
