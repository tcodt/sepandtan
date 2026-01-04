import { FileTextIcon, HeartHandshakeIcon, SwatchBookIcon } from "lucide-react";
import Image from "next/image";
import React from "react";

const items = [
  {
    id: 1,
    title: "طراحی شده برای محیط واقعی شما",
    description:
      "مواد غذایی رژیم بر اساس چیزهایی که هر روز در خانه داریم انتخاب می‌شه (برنج، مرغ، ماست، سبزیجات محلی و ...) تمرینات هم دقیقاً با امکانات موجود (خانه بدون وسیله یا باشگاه مجهز) هماهنگ می‌شن.",
    icon: HeartHandshakeIcon,
  },
  {
    id: 2,
    title: "برنامه‌ای که هر روز با تو تغییر می‌کنه",
    description:
      "هوش مصنوعی پیشرفتت رو می‌بینه، وزن و انرژی روزانه‌ات رو بررسی می‌کنه و برنامه رو هوشمندانه به‌روزرسانی می‌کنه، دیگر لازم نیست برنامه‌های ثابت و تکراری رو دنبال کنی؛ برنامه همیشه با شرایط فعلی تو هماهنگه.",
    icon: FileTextIcon,
  },
  {
    id: 3,
    title: "همه چیز ساده، واضح و قابل پیگیری",
    description:
      "حرکات با گیف و ویدیوهای کوتاه و دقیق آموزش داده می‌شن، داشبورد روزانه وزن، عکس قبل/بعد، کالری مصرفی و پیشرفت هفتگی رو به شکلی زیبا نشون می‌ده.",
    icon: SwatchBookIcon,
  },
];

export default function AboutFeature() {
  return (
    <section className="mb-12 p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center gap-10">
        <div>
          <h3 className="md:text-2xl text-xl text-foreground font-semibold mb-2 md:mb-4">
            سپندتن؛ مربی هوشمند فیتنس
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            اپلیکیشنی که با هوش مصنوعی برنامه تمرینی و رژیم شخصی می‌سازه تا تو
            هر روز به هدفت نزدیک‌تر بشی.
          </p>
          <div className="mt-8 grid grid-cols-subgrid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-muted p-4 rounded-2xl border border-border hover:shadow-lg transition-shadow flex items-start gap-4"
              >
                <span className="p-2 bg-primary/20 rounded-full">
                  {item.icon && (
                    <item.icon className="text-primary" size={30} />
                  )}
                </span>
                <div>
                  <h4 className="mb-2 text-popover-foreground text-base font-semibold">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute bottom-6 right-6 z-20 w-1/2">
            <h4 className="text-3xl font-bold text-background mb-2">
              جایی که فیتنس <span className="text-primary">هوشمند</span> میشود
            </h4>
            <p className="text-base font-medium text-muted">
              اولین برنامه تناسب اندام که با بیولوژی شما سازگار است.
            </p>
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-2xl z-10"></div>
          <Image
            src="/images/dumbbell.jpg"
            alt="Dumbbell"
            width={700}
            height={700}
            className="object-contain rounded-2xl border border-border shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
