import Link from "next/link";
import React from "react";
import { buttonVariants } from "../ui/button";
import { BotIcon, ChartPieIcon, DumbbellIcon, SoupIcon } from "lucide-react";

const services = [
  {
    id: 1,
    title: "برنامه کاملاً شخصی با هوش مصنوعی",
    description:
      "بر اساس قد، وزن، سطح آمادگی و امکانات شما برنامه روزانه می‌نویسد. هر روز به‌صورت هوشمند تنظیم می‌شود تا بیشترین نتیجه را بگیرید.",
    icon: BotIcon,
  },
  {
    id: 2,
    title: "تمرینات قابل اجرا در خانه یا باشگاه",
    description:
      "بیش از ۵۰۰ حرکت با گیف و ویدیوهای واضح و دقیق. مهم نیست وسیله داشته باشید یا نه؛ برنامه دقیقاً با شرایط شما هماهنگ است.",
    icon: DumbbellIcon,
  },
  {
    id: 3,
    title: "رژیم غذایی واقعی و قابل پیگیری",
    description:
      "با مواد در دسترس مثل برنج، مرغ، ماست و سبزیجات محلی طراحی شده. کالری و پروتئین دقیق محاسبه می‌شود + جایگزین هوشمند دارد.",
    icon: SoupIcon,
  },
  {
    id: 4,
    title: "پیگیری روزانه و گزارش پیشرفت",
    description:
      "وزن، عکس قبل/بعد، خواب و انرژی را ثبت و نمایش می‌دهد. هر هفته می‌بینید دقیقاً چقدر پیشرفت کرده‌اید.",
    icon: ChartPieIcon,
  },
];

export default function Services() {
  return (
    <section className="my-12 p-4 md:p-8">
      <div className="flex flex-row items-center justify-between">
        <div className="md:w-2/4 w-full">
          <h3 className="md:text-2xl text-xl font-semibold text-forground">
            چرا سپندتن؟
          </h3>
          <p className="text-sm text-muted-foreground font-medium mt-2 hidden md:block">
            با هوش مصنوعی پیشرفته و تمرکز کامل روی نیازهای واقعی، برنامه‌ای شخصی
            می‌سازیم که واقعاً برای شما کار می‌کند بدون سردرگمی، بدون برنامه‌های
            تکراری خارجی.
          </p>
        </div>
        <div>
          <Link
            href="/all-features"
            className={buttonVariants({ variant: "link" })}
          >
            دیدن همه ویژگی ها
          </Link>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              className="bg-muted p-4 rounded-2xl hover:shadow-lg transition-shadow duration-300 text-center border border-border"
            >
              <span className="bg-primary/20 inline-block p-2 rounded-full text-primary">
                <Icon size={30} />
              </span>
              <h4 className="text-gray-700 dark:text-gray-200 text-sm md:text-base font-semibold my-4">
                {service.title}
              </h4>
              <p className="text-muted-foreground text-xs md:text-sm font-medium leading-normal">
                {service.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
