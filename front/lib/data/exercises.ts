export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "glutes"
  | "core"
  | "full_body";

export type Exercise = {
  id: string;
  name: string;
  nameEn: string;
  category: "strength" | "cardio" | "mobility" | "yoga";
  level: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  duration?: string;
  calories?: string;
  image: string;
  videoUrl?: string; // یا گیف
  description: string;
  instructions: string[];
  tips: string[];
  isPopular?: boolean;
};

export const muscleLabels: Record<MuscleGroup, string> = {
  chest: "سینه",
  back: "پشت",
  shoulders: "شانه",
  arms: "بازو",
  legs: "پا",
  glutes: "باسن",
  core: "میان‌تنه",
  full_body: "کل بدن",
};

export const exercises: Exercise[] = [
  {
    id: "1",
    name: "اسکوات با وزن بدن",
    nameEn: "Bodyweight Squat",
    category: "strength",
    level: "beginner",
    equipment: ["وزن بدن"],
    primaryMuscles: ["legs", "glutes"],
    secondaryMuscles: ["core"],
    duration: "۱۰–۱۵ دقیقه",
    calories: "۸۰–۱۲۰",
    image: "/images/athlete-5.jpg",
    videoUrl: "/images/athlete-5.jpg", // فعلاً تصویر؛ بعداً گیف/ویدیو
    description: "حرکت پایه برای تقویت پا و باسن. مناسب خانه و مبتدی‌ها.",
    instructions: [
      "پاها را به اندازه عرض شانه باز کنید.",
      "سینه را بالا نگه دارید و نگاه را جلو.",
      "باسن را به عقب ببرید و زانوها را خم کنید تا ران‌ها موازی زمین شوند.",
      "با فشار پاشنه پاها بلند شوید و به حالت ایستاده برگردید.",
      "در تمام حرکت زانوها را هم‌راستا با انگشتان پا نگه دارید.",
    ],
    tips: [
      "پاشنه‌ها را از زمین جدا نکنید.",
      "کمر را گرد نکنید.",
      "اگر تعادل سخت است، دست‌ها را جلو بیاورید.",
    ],
    isPopular: true,
  },
  {
    id: "2",
    name: "شنا سوئدی",
    nameEn: "Push-up",
    category: "strength",
    level: "intermediate",
    equipment: ["وزن بدن"],
    primaryMuscles: ["chest", "arms"],
    secondaryMuscles: ["shoulders", "core"],
    duration: "۸–۱۲ دقیقه",
    calories: "۷۰–۱۰۰",
    image: "/images/athlete-2.jpg",
    videoUrl: "/images/athlete-2.jpg",
    description: "یکی از بهترین حرکات برای سینه، شانه و پشت بازو بدون تجهیزات.",
    instructions: [
      "در وضعیت پلانک بالا قرار بگیرید؛ دست‌ها کمی جلوتر از شانه.",
      "بدن را از سر تا پاشنه صاف نگه دارید.",
      "آرنج‌ها را خم کنید و سینه را به سمت زمین پایین ببرید.",
      "تا جایی پایین بروید که سینه نزدیک زمین شود.",
      "با فشار دست‌ها به حالت اول برگردید.",
    ],
    tips: [
      "باسن را بالا ندهید و کمر را قوس ندهید.",
      "اگر سخت است از زانو شروع کنید.",
      "نفس را هنگام پایین رفتن بگیرید و هنگام بالا خارج کنید.",
    ],
    isPopular: true,
  },
  {
    id: "3",
    name: "پلانک",
    nameEn: "Plank",
    category: "strength",
    level: "beginner",
    equipment: ["وزن بدن"],
    primaryMuscles: ["core"],
    secondaryMuscles: ["shoulders", "glutes"],
    duration: "۳–۵ دقیقه",
    calories: "۳۰–۵۰",
    image: "/images/athlete-3.webp",
    videoUrl: "/images/athlete-3.webp",
    description: "حرکت ایزومتریک عالی برای تقویت میان‌تنه و ثبات بدن.",
    instructions: [
      "روی ساعدها و پنجه پاها قرار بگیرید.",
      "بدن را در یک خط صاف از سر تا پاشنه نگه دارید.",
      "شکم را منقبض کنید و باسن را نه بالا بدهید نه پایین.",
      "نگاه را کمی جلوتر از دست‌ها روی زمین ثابت کنید.",
      "برای زمان مشخص شده وضعیت را حفظ کنید.",
    ],
    tips: [
      "نفس را حبس نکنید؛ آرام نفس بکشید.",
      "شانه را از گوش دور نگه دارید.",
      "اگر کمر درد گرفت، فرم را اصلاح کنید یا توقف کنید.",
    ],
  },
  {
    id: "4",
    name: "لانگز معکوس",
    nameEn: "Reverse Lunge",
    category: "strength",
    level: "intermediate",
    equipment: ["وزن بدن", "دمبل (اختیاری)"],
    primaryMuscles: ["legs", "glutes"],
    secondaryMuscles: ["core"],
    duration: "۱۰–۱۲ دقیقه",
    calories: "۹۰–۱۳۰",
    image: "/images/athlete-1.webp",
    videoUrl: "/images/athlete-1.webp",
    description:
      "حرکت تک‌پا برای تقویت پا و باسن با فشار کمتر روی زانو نسبت به لانگز جلو.",
    instructions: [
      "صاف بایستید و پاها را نزدیک هم قرار دهید.",
      "یک پا را به عقب ببرید و هر دو زانو را خم کنید.",
      "تا جایی پایین بروید که زانوی عقب نزدیک زمین شود.",
      "با فشار پاشنه پای جلو به حالت ایستاده برگردید.",
      "طرف دیگر را تکرار کنید.",
    ],
    tips: [
      "تنه را صاف نگه دارید.",
      "زانوی جلو از انگشتان پا جلوتر نرود.",
      "قدم عقب را خیلی کوتاه یا خیلی بلند برندارید.",
    ],
    isPopular: true,
  },
  {
    id: "5",
    name: "ددلیفت رومانیایی با دمبل",
    nameEn: "Romanian Deadlift",
    category: "strength",
    level: "intermediate",
    equipment: ["دمبل"],
    primaryMuscles: ["legs", "glutes", "back"],
    secondaryMuscles: ["core", "arms"],
    duration: "۱۰–۱۵ دقیقه",
    calories: "۱۰۰–۱۵۰",
    image: "/images/athlete-4.jpeg",
    videoUrl: "/images/athlete-4.jpeg",
    description:
      "تمرکز روی پشت پا و باسن با حفظ کمر خنثی؛ عالی برای خانه با دمبل.",
    instructions: [
      "دمبل‌ها را جلوی ران نگه دارید؛ پاها به عرض لگن.",
      "باسن را به عقب ببرید و بالاتنه را با کمر صاف پایین بیاورید.",
      "دمبل‌ها نزدیک پاها حرکت کنند.",
      "تا احساس کشش در پشت پا ادامه دهید.",
      "با فشار پاشنه و انقباض باسن به حالت ایستاده برگردید.",
    ],
    tips: [
      "کمر را گرد نکنید.",
      "زانوها فقط کمی خم باشند.",
      "حرکت از باسن شروع می‌شود نه از کمر.",
    ],
  },
  {
    id: "6",
    name: "کوهنورد",
    nameEn: "Mountain Climber",
    category: "cardio",
    level: "intermediate",
    equipment: ["وزن بدن"],
    primaryMuscles: ["core", "full_body"],
    secondaryMuscles: ["shoulders", "legs"],
    duration: "۵–۱۰ دقیقه",
    calories: "۱۰۰–۱۶۰",
    image: "/images/athlete-6.jpg",
    videoUrl: "/images/athlete-6.jpg",
    description: "حرکت کاردیو و میان‌تنه برای افزایش ضربان قلب و چربی‌سوزی.",
    instructions: [
      "در وضعیت پلانک بالا قرار بگیرید.",
      "یک زانو را به سمت سینه بیاورید.",
      "سریع پاها را عوض کنید مثل دویدن درجا در حالت پلانک.",
      "لگن را ثابت و نزدیک خط بدن نگه دارید.",
      "برای زمان یا تعداد مشخص ادامه دهید.",
    ],
    tips: [
      "باسن را بالا ندهید.",
      "سرعت را کنترل‌شده افزایش دهید.",
      "دست‌ها زیر شانه بمانند.",
    ],
    isPopular: true,
  },
];

export function getExerciseById(id: string) {
  return exercises.find((e) => e.id === id);
}
