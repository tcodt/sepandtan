"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Flame, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Exercise } from "@/lib/data/exercises";
import { muscleLabels } from "@/lib/data/exercises";

const levelMap = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

type ExerciseCardProps = {
  exercise: Exercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Card className="group overflow-hidden border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm rounded-2xl hover:shadow-md transition-all">
      <Link href={`/workouts/${exercise.id}`} className="block">
        <div className="relative aspect-4/3 overflow-hidden">
          <Image
            src={exercise.image}
            alt={exercise.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {exercise.isPopular && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
              محبوب
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm"
          >
            {levelMap[exercise.level]}
          </Badge>
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        <div>
          <Link href={`/workouts/${exercise.id}`}>
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {exercise.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {exercise.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {exercise.primaryMuscles.slice(0, 3).map((m) => (
            <Badge
              key={m}
              variant="outline"
              className="text-[10px] font-normal"
            >
              {muscleLabels[m]}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {exercise.duration ?? "—"}
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {exercise.calories ?? "—"} کالری
          </span>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full gap-1">
          <Link href={`/workouts/${exercise.id}`}>
            جزئیات حرکت
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
