import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground">آفلاین هستی</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        اتصال اینترنت برقرار نیست. بعداً دوباره تلاش کن.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
      >
        بازگشت به خانه
      </Link>
    </div>
  );
}
