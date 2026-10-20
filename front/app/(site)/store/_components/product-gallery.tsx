"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookmarkIcon, HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CommentsDrawer } from "./comments-drawer";
import { Product } from "@/lib/products-type";
import ShareDialog from "@/components/common/share-dialog";
import { toast } from "sonner";

export default function ProductGallery({ product }: { product: Product }) {
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
      <Separator />
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={"ghost"}
              onClick={() =>
                toast.success("محصول ذخیره شد!", {
                  position: "bottom-right",
                })
              }
            >
              <BookmarkIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>ذخیره</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* <Button variant={"ghost"}>
              <SendIcon />
            </Button> */}

            <ShareDialog title={product.name} />
          </TooltipTrigger>
          <TooltipContent>
            <p>ارسال</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={"ghost"} className="flex items-center gap-2">
              <span className="text-sm">
                {(product.likes || 133).toLocaleString()}
              </span>
              <HeartIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>علاقه‌مند</p>
          </TooltipContent>
        </Tooltip>

        {/* Comments button with drawer */}
        <CommentsDrawer
          productComments={product.comments}
          productName={product.name}
        />
      </div>
    </Card>
  );
}
