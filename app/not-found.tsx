import Link from "next/link";
import { Home, Search, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-24 w-80 h-80 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Flame className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-7xl sm:text-8xl font-extrabold text-primary tracking-tight mb-3">
            ۴۰۴
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            صفحه پیدا نشد
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto">
            آدرسی که وارد کردی وجود ندارد یا جابه‌جا شده. نگران نباش، سریع
            برمی‌گردونیم‌ت به مسیر درست.
          </p>
        </div>

        <Card className="border-border bg-card/90 dark:bg-card/80 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-center">
              چیکار می‌تونی بکنی؟
            </CardTitle>
            <CardDescription className="text-center">
              یکی از گزینه‌های زیر را انتخاب کن
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Button asChild className="w-full h-11 justify-between">
              <Link href="/">
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  بازگشت به صفحه اصلی
                </span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-11 justify-between"
            >
              <Link href="/store">
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  رفتن به فروشگاه
                </span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-11 justify-between"
            >
              <Link href="/contact">
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  تماس با پشتیبانی
                </span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            خانه
          </Link>
          <span className="text-border">|</span>
          <Link href="/about" className="hover:text-primary transition-colors">
            درباره ما
          </Link>
          <span className="text-border">|</span>
          <Link
            href="/contact"
            className="hover:text-primary transition-colors"
          >
            تماس با ما
          </Link>
          <span className="text-border">|</span>
          <Link
            href="/workouts"
            className="hover:text-primary transition-colors"
          >
            حرکات
          </Link>
        </div>
      </div>
    </div>
  );
}
