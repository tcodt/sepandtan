import { Badge } from "@/components/ui/badge";
import { type MuscleGroup, muscleLabels } from "@/lib/data/exercises";

type ExerciseMusclesProps = {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
};

export function ExerciseMuscles({ primary, secondary }: ExerciseMusclesProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-2">عضلات اصلی</p>
        <div className="flex flex-wrap gap-2">
          {primary.map((m) => (
            <Badge
              key={m}
              className="bg-primary/15 text-primary border-primary/20"
            >
              {muscleLabels[m]}
            </Badge>
          ))}
        </div>
      </div>

      {secondary.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">عضلات کمکی</p>
          <div className="flex flex-wrap gap-2">
            {secondary.map((m) => (
              <Badge key={m} variant="outline">
                {muscleLabels[m]}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
