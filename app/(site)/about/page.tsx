import { Metadata } from "next";
import { Brain, Target, Heart, Users, Sparkles, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "درباره سپندتن | مربی هوشمند تو",
  description:
    "سپندتن پلتفرم فیتنس با هوش مصنوعی است که برنامه تمرینی و رژیم شخصی‌سازی‌شده می‌سازد.",
};

const values = [
  {
    icon: Brain,
    title: "هوش مصنوعی واقعی",
    description:
      "برنامه‌ها بر اساس اطلاعات بدنی، امکانات و هدف تو ساخته می‌شوند، نه یک قالب ثابت.",
  },
  {
    icon: Target,
    title: "نتیجه‌محور",
    description:
      "هر تمرین و هر وعده غذایی با هدف مشخص طراحی می‌شود تا سریع‌تر به نتیجه برسی.",
  },
  {
    icon: Heart,
    title: "سلامت در اولویت",
    description:
      "ما فقط به ظاهر فکر نمی‌کنیم. سلامت بلندمدت و پایداری برنامه برایمان مهم است.",
  },
  {
    icon: Users,
    title: "همراهی مداوم",
    description:
      "از روز اول تا رسیدن به هدف، سپندتن کنارت است و برنامه را با پیشرفت تو به‌روز می‌کند.",
  },
];

const stats = [
  { value: "۱۰٬۰۰۰+", label: "ورزشکار فعال" },
  { value: "۹۸٪", label: "رضایت کاربران" },
  { value: "۳۰ ثانیه", label: "ساخت برنامه اولیه" },
  { value: "۲۴/۷", label: "پشتیبانی" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            درباره سپندتن
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-6">
            مربی شخصی هوشمند
            <span className="block text-primary mt-1">
              برای هر بدن و هر هدف
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            سپندتن با ترکیب هوش مصنوعی و دانش ورزشی، برنامه تمرینی و رژیم
            شخصی‌سازی‌شده می‌سازد تا بدون سردرگمی، به بدنی قوی‌تر و سالم‌تر
            برسی.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              چرا سپندتن به وجود آمد؟
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              خیلی‌ها برنامه‌های عمومی را شروع می‌کنند و بعد از چند هفته رها
              می‌کنند. چون برنامه با شرایط واقعی‌شان (خانه یا باشگاه، سطح
              آمادگی، هدف دقیق) هماهنگ نیست.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              سپندتن این مشکل را حل می‌کند: اطلاعاتت را می‌گیرد، امکاناتت را
              می‌فهمد و هدف‌ات را جدی می‌گیرد. بعد یک برنامه واقعی و قابل اجرا
              تحویلت می‌دهد.
            </p>
          </div>

          <Card className="border-border bg-muted/50 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                مأموریت ما
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                تبدیل تناسب اندام به یک تجربه ساده، هوشمند و پایدار برای همه
                فارسی‌زبانان؛ فرقی نمی‌کند در خانه تمرین کنی یا باشگاه.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/40 border-y border-border py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              ارزش‌های ما
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              این‌ها اصولی هستند که در طراحی محصول و تجربه کاربری همیشه رعایت
              می‌کنیم.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="border-border bg-muted/50 backdrop-blur-sm"
                >
                  <CardHeader className="pb-2">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
