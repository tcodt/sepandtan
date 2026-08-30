import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, Flame, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExerciseById } from "@/lib/data/exercises";
import { ExerciseMedia } from "@/components/exercises/exercise-media";
import { ExerciseInstructions } from "@/components/exercises/exercise-instructions";
import { AddToPlanButton } from "@/components/exercises/add-to-plan-button";
import { ExerciseMuscles } from "@/components/exercises/exercise-miscles";

const levelMap = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const exercise = getExerciseById(id);

  if (!exercise) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2">
          <Link href="/workouts">
            <ArrowRight className="w-4 h-4" />
            بازگشت به حرکات
          </Link>
        </Button>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Media + actions */}
          <div className="lg:col-span-3 space-y-4">
            <ExerciseMedia
              name={exercise.name}
              image={exercise.image}
              videoUrl={exercise.videoUrl}
            />

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{levelMap[exercise.level]}</Badge>
              {exercise.equipment.map((eq) => (
                <Badge key={eq} variant="outline">
                  {eq}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {exercise.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {exercise.nameEn}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {exercise.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {exercise.duration}
                </span>
              )}
              {exercise.calories && (
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  {exercise.calories} کالری
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                {exercise.equipment.join("، ")}
              </span>
            </div>

            <Card className="border-border bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">عضلات درگیر</CardTitle>
              </CardHeader>
              <CardContent>
                <ExerciseMuscles
                  primary={exercise.primaryMuscles}
                  secondary={exercise.secondaryMuscles}
                />
              </CardContent>
            </Card>

            <AddToPlanButton exercise={exercise} />

            <Button asChild variant="outline" className="w-full">
              <Link href="/workout/today">رفتن به برنامه امروز</Link>
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Card className="border-border bg-muted/50">
          <CardContent className="p-5 sm:p-6">
            <ExerciseInstructions
              description={exercise.description}
              instructions={exercise.instructions}
              tips={exercise.tips}
            />
          </CardContent>
        </Card>

        {/* Audio placeholder – بعداً می‌تونی فایل صوتی واقعی بذاری */}
        <Card className="border-border bg-muted/40">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                توضیح صوتی حرکت
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                به زودی فایل صوتی مربی اضافه می‌شود
              </p>
            </div>
            <Button variant="secondary" size="sm" disabled>
              پخش صوت
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
