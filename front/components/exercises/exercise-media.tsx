"use client";

import Image from "next/image";
import { Play } from "lucide-react";

type ExerciseMediaProps = {
  name: string;
  image: string;
  videoUrl?: string;
};

export function ExerciseMedia({ name, image, videoUrl }: ExerciseMediaProps) {
  return (
    <div className="relative aspect-video sm:aspect-16/10 rounded-2xl overflow-hidden border border-border bg-muted">
      {/* فعلاً تصویر؛ وقتی گیف/ویدیو داشتی src را عوض کن */}
      <Image
        src={videoUrl || image}
        alt={name}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 60vw"
      />

      {/* اگر بعداً ویدیو واقعی گذاشتی، این دکمه پلی را فعال کن */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg">
          <Play className="w-6 h-6 fill-current" />
        </div>
      </div>
    </div>
  );
}
