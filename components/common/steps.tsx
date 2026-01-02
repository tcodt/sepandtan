import { FileChartLineIcon, NotebookPenIcon, QrCodeIcon } from "lucide-react";

export default function Steps() {
  const steps = [
    {
      number: "1",
      icon: QrCodeIcon,
      title: "ثبت اطلاعاتت",
      details: [
        "قد، وزن، هدف (لاغری/عضله/تناسب)",
        "سطح فعالیت و امکاناتت (خانه یا باشگاه)",
        "هوش مصنوعی سپندتن همه چیز رو در کمتر از ۳۰ ثانیه تحلیل می‌کنه",
      ],
    },
    {
      number: "2",
      icon: NotebookPenIcon,
      title: "دریافت برنامه شخصی",
      details: [
        "برنامه تمرینی روزانه + رژیم غذایی بر اساس مواد در دسترس",
        "کالری دقیق برات ساخته می‌شه",
        "همه حرکات با گیف و ویدیو + توضیحات ساده",
      ],
    },
    {
      number: "3",
      icon: FileChartLineIcon,
      title: "پیگیری و پیشرفت روزانه",
      details: [
        "هر روز وزن، وعده‌ها و تمریناتت رو ثبت کن",
        "اپلیکیشن پیشرفتت رو نشون می‌ده",
        "برنامه رو به‌روز می‌کنه و انگیزه‌ات رو بالا نگه می‌داره",
      ],
    },
  ];

  return (
    <div className="w-full py-12 px-4 md:px-8">
      <h2 className="sr-only">Steps</h2>

      {/* Mobile View - Vertical */}
      <div className="md:hidden space-y-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex gap-6">
              {/* Number and Icon */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-16 bg-primary/30 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                  <h3 className="text-base font-bold text-popover-foreground">
                    {step.title}
                  </h3>
                </div>
                <ul className="space-y-2 mr-2">
                  {step.details.map((detail, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-muted-foreground text-sm"
                    >
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet View - Horizontal */}
      <div className="hidden md:flex gap-8 lg:gap-12">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex-1">
              <div className="flex flex-col h-full">
                {/* Number and Icon */}
                <div className="flex flex-col items-center mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
                    {step.number}
                  </div>
                  {index < steps.length && (
                    <div className="hidden lg:block w-0.5 h-12 bg-primary/30 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex flex-col items-center gap-3 mb-4 text-center">
                    <Icon className="w-8 h-8 text-primary" />
                    <h3 className="text-lg font-bold text-popover-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-muted-foreground text-sm text-center justify-center"
                      >
                        <span className="text-primary font-bold shrink-0">
                          •
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
