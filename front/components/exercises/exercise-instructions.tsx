type ExerciseInstructionsProps = {
  instructions: string[];
  tips: string[];
  description: string;
};

export function ExerciseInstructions({
  instructions,
  tips,
  description,
}: ExerciseInstructionsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-2">
          توضیح حرکت
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          مراحل اجرا
        </h2>
        <ol className="space-y-3">
          {instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-foreground leading-relaxed pt-0.5">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {tips.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            نکات مهم
          </h3>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
