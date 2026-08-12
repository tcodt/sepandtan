import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card/80 dark:bg-card/60 overflow-hidden divide-y divide-border">
        {children}
      </div>
    </section>
  );
}