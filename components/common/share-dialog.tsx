"use client";

import {
  WhatsappShareButton,
  TelegramShareButton,
  WhatsappIcon,
  TelegramIcon,
} from "react-share";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  title: string;
  description?: string;
}

export default function ShareDialog({ title }: Props) {
  const pathname = usePathname();

  const url =
    typeof window !== "undefined" ? `${window.location.origin}${pathname}` : "";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <SendIcon size={16} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اشتراک گذاری این محصول</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <WhatsappShareButton url={url} title={title}>
            <WhatsappIcon size={48} round />
          </WhatsappShareButton>

          <TelegramShareButton url={url} title={title}>
            <TelegramIcon size={48} round />
          </TelegramShareButton>
        </div>

        <div className="mt-6 flex gap-2">
          <input
            value={url}
            readOnly
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <Button onClick={() => navigator.clipboard.writeText(url)}>
            کپی
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
