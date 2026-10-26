/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import type { Plan, PlanDay } from "@/lib/types/plan";
import type { PlanAccess } from "@/lib/types/access";
import { pdfStyles as s } from "./styles";
import { registerPdfFonts } from "./register-fonts";

registerPdfFonts();

/** لوگوی رسمی سپندتن از public */
const LOGO_SRC = "/images/logo-light.jpg";

const MEAL_TYPE_FA: Record<string, string> = {
  breakfast: "صبحانه",
  snack: "میان‌وعده",
  lunch: "ناهار",
  dinner: "شام",
};

const GOAL_FA: Record<string, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "عضله‌سازی",
  maintain: "حفظ وزن",
  endurance: "استقامت",
  general_fitness: "آمادگی عمومی",
};

const LEVEL_FA: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

const EQUIPMENT_FA: Record<string, string> = {
  home: "خانگی",
  gym: "باشگاه",
  both: "خانگی و باشگاه",
};

type Props = {
  plan: Plan;
  access?: PlanAccess | null;
  userName?: string;
};

/** لوگوی پس‌زمینه با شفافیت کم — در همه صفحات تکرار می‌شود */
function BackgroundLogo({ cover = false }: { cover?: boolean }) {
  return (
    <Image src={LOGO_SRC} style={cover ? s.coverBgLogo : s.bgLogo} fixed />
  );
}

/** برچسب متا روی جلد به شکل «برچسب: مقدار» */
function CoverMeta({ label, value }: { label: string; value: string }) {
  return (
    <Text style={s.coverMeta}>
      <Text style={s.coverMetaLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerRow}>
        <Text style={s.footerText}>سپندتن — مربی شخصی هوشمند تو</Text>
        <Text style={s.footerText}>sepandtan.vercel.app</Text>
      </View>
      <View style={s.footerRow}>
        <Text style={s.footerText}>۰۹۹۸۲۵۰۹۳۹۳ · sepandtan@gmail.com</Text>
        <Text style={s.footerText}>گیلان، بندر کیاشهر</Text>
      </View>
      <Text style={s.disclaimer}>
        این برنامه جنبه آموزشی و پیشنهادی دارد و جایگزین تشخیص یا تجویز پزشک /
        متخصص تغذیه نیست. قبل از شروع برنامه تمرینی یا رژیم جدید با متخصص مشورت
        کنید. سپندتن مسئولیتی در قبال اجرای نادرست یا آسیب ناشی از تمرین ندارد.
      </Text>
    </View>
  );
}

function CoverPage({ plan, access, userName }: Props) {
  const sourceLabel =
    plan.source === "coach"
      ? `مربی: ${access?.coachName ?? "تأیید‌شده"}`
      : "ساخته‌شده با هوش مصنوعی سپندتن";

  const period =
    access?.startDate && access?.endDate
      ? `${new Date(access.startDate).toLocaleDateString("fa-IR")} تا ${new Date(access.endDate).toLocaleDateString("fa-IR")}`
      : `${plan.durationDays} روز`;

  return (
    <Page size="A4" style={s.coverPage}>
      <BackgroundLogo cover />

      {/* سربرگ برند */}
      <Image src={LOGO_SRC} style={s.logoBadge} />
      <View style={s.coverTopRule} />
      <Text style={s.brand}>سپندتن</Text>
      <Text style={s.brandEn}>SepandTan</Text>

      {/* عنوان برنامه */}
      <Text style={s.coverTitle}>{plan.title}</Text>
      {plan.description ? (
        <Text style={s.coverMeta}>{plan.description}</Text>
      ) : null}

      <View style={s.coverDivider} />

      {/* متادیتا */}
      {userName ? <CoverMeta label="برای" value={userName} /> : null}
      <CoverMeta label="هدف" value={GOAL_FA[plan.goal] ?? plan.goal} />
      <CoverMeta label="سطح" value={LEVEL_FA[plan.level] ?? plan.level} />
      <CoverMeta
        label="تجهیزات"
        value={EQUIPMENT_FA[plan.equipment] ?? plan.equipment}
      />
      <CoverMeta label="منبع" value={sourceLabel} />
      <CoverMeta label="بازه دسترسی" value={period} />

      <View style={s.coverBadge}>
        <Text>برنامه فعال · خروجی رسمی سپندتن</Text>
      </View>

      <View style={s.coverFooter}>
        <Text style={s.coverFooterText}>
          ۰۹۹۸۲۵۰۹۳۹۳ · sepandtan@gmail.com · Instagram: @sepandtan
        </Text>
      </View>
    </Page>
  );
}

function DayWorkoutBlock({ day }: { day: PlanDay }) {
  if (day.isRestDay) {
    return (
      <View style={s.dayBlock} wrap={false}>
        <Text style={s.dayHeader}>
          روز {day.dayNumber} — {day.title}
        </Text>
        <Text style={s.restDay}>روز استراحت</Text>
      </View>
    );
  }

  return (
    <View style={s.dayBlock} wrap={false}>
      <Text style={s.dayHeader}>
        روز {day.dayNumber} — {day.title}
      </Text>
      <Text style={s.dayMeta}>
        تمرکز: {day.focus} · حدود {day.estimatedMinutes} دقیقه
      </Text>
      {day.exercises.map((ex, idx) => (
        <View key={`${ex.exerciseId}-${idx}`} style={s.row}>
          <Text style={s.exerciseName}>
            {idx + 1}. {ex.name}
          </Text>
          <Text style={s.exerciseDetail}>
            {ex.sets}×{ex.reps} · {ex.restSeconds}s
          </Text>
        </View>
      ))}
    </View>
  );
}

function DayNutritionBlock({ day }: { day: PlanDay }) {
  if (!day.meals?.length) return null;

  return (
    <View style={s.dayBlock} wrap={false}>
      <Text style={s.dayHeader}>
        تغذیه روز {day.dayNumber} — هدف {day.dailyCaloriesTarget} کالری
      </Text>
      {day.meals.map((meal) => (
        <View key={meal.id} style={s.mealRow}>
          <Text style={s.mealType}>{MEAL_TYPE_FA[meal.type] ?? meal.type}</Text>
          <Text style={s.mealTitle}>
            {meal.description
              ? `${meal.title} — ${meal.description}`
              : meal.title}
          </Text>
          <Text style={s.mealCal}>{meal.calories} kcal</Text>
        </View>
      ))}
    </View>
  );
}

export function PlanPdfDocument({ plan, access, userName }: Props) {
  const days = plan.days ?? [];
  const hasDays = days.length > 0;

  return (
    <Document
      title={plan.title}
      author="SepandTan"
      subject="برنامه تمرینی و تغذیه"
      language="fa"
    >
      <CoverPage plan={plan} access={access} userName={userName} />

      <Page size="A4" style={s.page}>
        <BackgroundLogo />
        <Text style={s.sectionTitle}>برنامه تمرینی</Text>
        {!hasDays && (
          <Text style={s.emptyNote}>
            جزئیات روزبه‌روز این برنامه هنوز کامل نشده است.
          </Text>
        )}
        {days.map((day) => (
          <DayWorkoutBlock key={`w-${day.dayNumber}`} day={day} />
        ))}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <BackgroundLogo />
        <Text style={s.sectionTitle}>برنامه تغذیه</Text>
        {!hasDays && (
          <Text style={s.emptyNote}>
            جزئیات تغذیه این برنامه هنوز کامل نشده است.
          </Text>
        )}
        {days.map((day) => (
          <DayNutritionBlock key={`n-${day.dayNumber}`} day={day} />
        ))}
        <Footer />
      </Page>
    </Document>
  );
}
