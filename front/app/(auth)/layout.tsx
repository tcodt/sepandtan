import { ModeToggle } from "@/components/common/mode-toggle";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header ساده */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/main-logo.png"
            alt="سپندتن"
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="font-bold text-lg text-foreground hidden sm:block">
            سپندتن
          </span>
        </Link>
        <ModeToggle />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Background glow – کار می‌کند در light و dark */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -right-32 w-100 h-100 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-24 w-75 h-75 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
