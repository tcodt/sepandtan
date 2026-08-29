/**
 * تولید برنامه ۳۰ روزه شخصی‌سازی‌شده و واقعی‌تر
 * - حرکات تصادفی از استخر بزرگ
 * - حجم بر اساس Goal + Level
 * - Rest Day هوشمند
 * - کالری متغیر روزانه
 * - پیشرفت تدریجی در طول ۳۰ روز
 */

import type {
  BodyInfo,
  Equipment,
  Goal,
  Plan,
  PlanDay,
  PlanExercise,
  PlanMeal,
  ActivityLevel,
} from "@/lib/types/plan";

type GenerateInput = {
  userId: string;
  bodyInfo: BodyInfo;
  equipment: Equipment;
  goal: Goal;
  targetWeight?: number;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* -------------------------------------------------------------------------- */
/*  Muscle labels                                                             */
/* -------------------------------------------------------------------------- */

const MUSCLE_FA: Record<string, string> = {
  chest: "سینه",
  back: "پشت",
  shoulders: "شانه",
  arms: "بازو",
  legs: "پا",
  glutes: "باسن",
  core: "میان‌تنه",
  full_body: "کل بدن",
};

/* -------------------------------------------------------------------------- */
/*  Exercise Pool (گسترده‌تر و واقعی‌تر)                                        */
/* -------------------------------------------------------------------------- */

type PoolItem = {
  id: string;
  name: string;
  muscle: string;
  home: boolean;
  gym: boolean;
  difficulty: 1 | 2 | 3; // 1 آسان · 2 متوسط · 3 سخت
};

const EXERCISE_POOL: Record<string, PoolItem[]> = {
  push: [
    {
      id: "p1",
      name: "شنا سوئدی",
      muscle: "chest",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "p2",
      name: "شنا الماسی",
      muscle: "chest",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "p3",
      name: "پرس سینه با دمبل",
      muscle: "chest",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "p4",
      name: "پرس سینه هالتر",
      muscle: "chest",
      home: false,
      gym: true,
      difficulty: 3,
    },
    {
      id: "p5",
      name: "فلای دمبل",
      muscle: "chest",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "p6",
      name: "دیپ روی صندلی",
      muscle: "arms",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "p7",
      name: "دیپ پارالل",
      muscle: "arms",
      home: false,
      gym: true,
      difficulty: 3,
    },
    {
      id: "p8",
      name: "پرس سرشانه با دمبل",
      muscle: "shoulders",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "p9",
      name: "پرس سرشانه هالتر",
      muscle: "shoulders",
      home: false,
      gym: true,
      difficulty: 3,
    },
    {
      id: "p10",
      name: "نشر جانب دمبل",
      muscle: "shoulders",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "p11",
      name: "شنا پا بالا",
      muscle: "chest",
      home: true,
      gym: true,
      difficulty: 3,
    },
  ],
  pull: [
    {
      id: "u1",
      name: "بارفیکس منفی",
      muscle: "back",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "u2",
      name: "بارفیکس کامل",
      muscle: "back",
      home: true,
      gym: true,
      difficulty: 3,
    },
    {
      id: "u3",
      name: "قایقی با کش",
      muscle: "back",
      home: true,
      gym: false,
      difficulty: 1,
    },
    {
      id: "u4",
      name: "قایقی دمبل",
      muscle: "back",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "u5",
      name: "لت پول‌داون",
      muscle: "back",
      home: false,
      gym: true,
      difficulty: 2,
    },
    {
      id: "u6",
      name: "فیس‌پول با کش",
      muscle: "shoulders",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "u7",
      name: "زیربغل دمبل تک‌دست",
      muscle: "back",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "u8",
      name: "تی‌بار رو",
      muscle: "back",
      home: false,
      gym: true,
      difficulty: 3,
    },
    {
      id: "u9",
      name: "کول دمبل",
      muscle: "shoulders",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "u10",
      name: "پول‌اور دمبل",
      muscle: "back",
      home: true,
      gym: true,
      difficulty: 2,
    },
  ],
  legs: [
    {
      id: "l1",
      name: "اسکوات با وزن بدن",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "l2",
      name: "اسکوات گابلت",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "l3",
      name: "اسکوات هالتر",
      muscle: "legs",
      home: false,
      gym: true,
      difficulty: 3,
    },
    {
      id: "l4",
      name: "لانگز معکوس",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "l5",
      name: "لانگز راهرفتنی",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "l6",
      name: "ددلیفت رومانیایی با دمبل",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "l7",
      name: "ددلیفت هالتر",
      muscle: "legs",
      home: false,
      gym: true,
      difficulty: 3,
    },
    {
      id: "l8",
      name: "هیپ تراست",
      muscle: "glutes",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "l9",
      name: "هیپ تراست با هالتر",
      muscle: "glutes",
      home: false,
      gym: true,
      difficulty: 2,
    },
    {
      id: "l10",
      name: "ساق پا ایستاده",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "l11",
      name: "استپ‌آپ روی نیمکت",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "l12",
      name: "بولگاریان اسپلیت اسکوات",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 3,
    },
  ],
  core: [
    {
      id: "c1",
      name: "پلانک",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "c2",
      name: "پلانک ساید",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "c3",
      name: "کرانچ دوچرخه",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "c4",
      name: "ددباگ",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "c5",
      name: "لگ‌ریز",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "c6",
      name: "کرانچ معکوس",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "c7",
      name: "روشنه‌گر",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "c8",
      name: "هالو بادی هولد",
      muscle: "core",
      home: true,
      gym: true,
      difficulty: 3,
    },
  ],
  cardio: [
    {
      id: "k1",
      name: "کوهنورد",
      muscle: "full_body",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "k2",
      name: "برپی",
      muscle: "full_body",
      home: true,
      gym: true,
      difficulty: 3,
    },
    {
      id: "k3",
      name: "جامپینگ جک",
      muscle: "full_body",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "k4",
      name: "اسکوات پرشی",
      muscle: "legs",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "k5",
      name: "های‌نیز",
      muscle: "full_body",
      home: true,
      gym: true,
      difficulty: 1,
    },
    {
      id: "k6",
      name: "برپی بدون شنا",
      muscle: "full_body",
      home: true,
      gym: true,
      difficulty: 2,
    },
    {
      id: "k7",
      name: "طناب زدن (فرضی)",
      muscle: "full_body",
      home: true,
      gym: true,
      difficulty: 2,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Meal pools (متنوع‌تر)                                                      */
/* -------------------------------------------------------------------------- */

const MEALS_LOSE: PlanMeal[] = [
  {
    id: "ml1",
    type: "breakfast",
    title: "املت سبزیجات + نان جو",
    description: "۲ تخم‌مرغ، گوجه، اسفناج، نان سبوس‌دار",
    calories: 320,
    protein: 22,
    carbs: 25,
    fat: 14,
  },
  {
    id: "ml2",
    type: "breakfast",
    title: "ماست یونانی + توت + دانه چیا",
    description: "۱۵۰گ ماست، توت فرنگی، ۱ ق چیا",
    calories: 280,
    protein: 20,
    carbs: 22,
    fat: 10,
  },
  {
    id: "ml3",
    type: "snack",
    title: "سیب + ۱۰ بادام",
    description: "۱ سیب متوسط + بادام خام",
    calories: 160,
    protein: 4,
    carbs: 22,
    fat: 7,
  },
  {
    id: "ml4",
    type: "snack",
    title: "خیار + هویج + حمّص",
    description: "سبزیجات خام با ۲ ق حمّص",
    calories: 140,
    protein: 5,
    carbs: 16,
    fat: 6,
  },
  {
    id: "ml5",
    type: "lunch",
    title: "سینه مرغ گریل + سالاد بزرگ",
    description: "۱۵۰گ مرغ، کاهو، خیار، گوجه، آبلیمو",
    calories: 380,
    protein: 40,
    carbs: 12,
    fat: 18,
  },
  {
    id: "ml6",
    type: "lunch",
    title: "تن ماهی + سالاد کینوا",
    description: "۱ قوطی تن در آب، کینوا پخته",
    calories: 400,
    protein: 35,
    carbs: 30,
    fat: 12,
  },
  {
    id: "ml7",
    type: "dinner",
    title: "ماهی سفید + سبزیجات بخارپز",
    description: "۱۵۰گ ماهی، بروکلی و هویج",
    calories: 340,
    protein: 35,
    carbs: 15,
    fat: 14,
  },
  {
    id: "ml8",
    type: "dinner",
    title: "سوپ عدس + سالاد کوچک",
    description: "سوپ خانگی کم‌چرب",
    calories: 310,
    protein: 18,
    carbs: 40,
    fat: 8,
  },
];

const MEALS_MUSCLE: PlanMeal[] = [
  {
    id: "mm1",
    type: "breakfast",
    title: "جو دوسر + شیر + کره بادام + موز",
    description: "۶۰گ جو، ۲۰۰میل شیر، ۱ ق کره بادام",
    calories: 520,
    protein: 24,
    carbs: 60,
    fat: 18,
  },
  {
    id: "mm2",
    type: "breakfast",
    title: "املت ۳ تخم‌مرغ + نان سبوس + پنیر",
    description: "پروتئین بالا برای شروع روز",
    calories: 480,
    protein: 32,
    carbs: 28,
    fat: 26,
  },
  {
    id: "mm3",
    type: "snack",
    title: "شیک پروتئین + موز + کره بادام",
    description: "۱ اسکوپ وی + ۱ موز",
    calories: 380,
    protein: 32,
    carbs: 35,
    fat: 12,
  },
  {
    id: "mm4",
    type: "snack",
    title: "ماست یونانی + عسل + گردو",
    description: "۲۰۰گ ماست + ۱ ق عسل",
    calories: 320,
    protein: 22,
    carbs: 28,
    fat: 12,
  },
  {
    id: "mm5",
    type: "lunch",
    title: "برنج قهوه‌ای + مرغ + سبزیجات",
    description: "۲۰۰گ مرغ، ۱ پیمانه برنج",
    calories: 680,
    protein: 48,
    carbs: 65,
    fat: 18,
  },
  {
    id: "mm6",
    type: "lunch",
    title: "پاستا گندم کامل + گوشت چرخ‌کرده",
    description: "پروتئین و کربوهیدرات بالا",
    calories: 720,
    protein: 42,
    carbs: 75,
    fat: 22,
  },
  {
    id: "mm7",
    type: "dinner",
    title: "سینه مرغ + سیب‌زمینی + سالاد",
    description: "۲۰۰گ مرغ، ۲۰۰گ سیب‌زمینی",
    calories: 580,
    protein: 48,
    carbs: 50,
    fat: 14,
  },
  {
    id: "mm8",
    type: "dinner",
    title: "ماهی سالمون + برنج + سبزیجات",
    description: "چربی مفید + پروتئین",
    calories: 620,
    protein: 40,
    carbs: 45,
    fat: 28,
  },
];

const MEALS_DEFAULT: PlanMeal[] = [
  {
    id: "md1",
    type: "breakfast",
    title: "نان و پنیر و گردو + خیار",
    description: "صبحانه سنتی متعادل",
    calories: 380,
    protein: 16,
    carbs: 35,
    fat: 18,
  },
  {
    id: "md2",
    type: "breakfast",
    title: "املت سبزی + نان سبوس",
    description: "۲ تخم‌مرغ + سبزیجات",
    calories: 360,
    protein: 20,
    carbs: 28,
    fat: 16,
  },
  {
    id: "md3",
    type: "snack",
    title: "ماست + میوه فصل",
    description: "۱ کاسه ماست کم‌چرب",
    calories: 200,
    protein: 12,
    carbs: 25,
    fat: 5,
  },
  {
    id: "md4",
    type: "snack",
    title: "مشتی آجیل مخلوط",
    description: "حدود ۳۰ گرم",
    calories: 180,
    protein: 6,
    carbs: 8,
    fat: 15,
  },
  {
    id: "md5",
    type: "lunch",
    title: "چلو مرغ",
    description: "پرس معمولی خانگی",
    calories: 550,
    protein: 35,
    carbs: 60,
    fat: 15,
  },
  {
    id: "md6",
    type: "lunch",
    title: "خوراک لوبیا + نان سبوس",
    description: "گیاهی و سیرکننده",
    calories: 480,
    protein: 22,
    carbs: 65,
    fat: 12,
  },
  {
    id: "md7",
    type: "dinner",
    title: "سوپ جو + نان سبوس + سالاد",
    description: "سبک و مغذی",
    calories: 340,
    protein: 14,
    carbs: 45,
    fat: 10,
  },
  {
    id: "md8",
    type: "dinner",
    title: "خوراک بادمجان + ماست",
    description: "سنتی و سبک",
    calories: 380,
    protein: 12,
    carbs: 35,
    fat: 18,
  },
];

function mealPoolForGoal(goal: Goal): PlanMeal[] {
  if (goal === "lose_weight") return MEALS_LOSE;
  if (goal === "build_muscle") return MEALS_MUSCLE;
  return MEALS_DEFAULT;
}

function buildMealsForDay(goal: Goal, dayNumber: number): PlanMeal[] {
  const pool = mealPoolForGoal(goal);
  const byType = {
    breakfast: pool.filter((m) => m.type === "breakfast"),
    snack: pool.filter((m) => m.type === "snack"),
    lunch: pool.filter((m) => m.type === "lunch"),
    dinner: pool.filter((m) => m.type === "dinner"),
  };

  const pick = (list: PlanMeal[], seed: number) => {
    if (list.length === 0) return pool[0];
    return list[seed % list.length];
  };

  return [
    { ...pick(byType.breakfast, dayNumber), id: `d${dayNumber}-bf` },
    { ...pick(byType.snack, dayNumber + 1), id: `d${dayNumber}-sn` },
    { ...pick(byType.lunch, dayNumber + 2), id: `d${dayNumber}-lu` },
    { ...pick(byType.dinner, dayNumber + 3), id: `d${dayNumber}-di` },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Level & Calories                                                          */
/* -------------------------------------------------------------------------- */

function getLevel(bodyInfo: BodyInfo, goal: Goal): Plan["level"] {
  if (
    bodyInfo.activityLevel === "sedentary" ||
    bodyInfo.activityLevel === "light"
  ) {
    return "beginner";
  }
  if (goal === "build_muscle" && bodyInfo.activityLevel === "very_active") {
    return "advanced";
  }
  if (
    bodyInfo.activityLevel === "very_active" ||
    bodyInfo.activityLevel === "active"
  ) {
    return "intermediate";
  }
  return "intermediate";
}

function getBaseCalorieTarget(bodyInfo: BodyInfo, goal: Goal): number {
  const { gender, weight, height, age, activityLevel } = bodyInfo;

  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const mul: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  let tdee = bmr * (mul[activityLevel] ?? 1.55);

  if (goal === "lose_weight") tdee -= 400;
  if (goal === "build_muscle") tdee += 300;
  if (goal === "endurance") tdee += 200;

  return Math.round(tdee / 10) * 10;
}

/** کالری روزانه کمی متغیر (واقعی‌تر) */
function dailyCalories(
  base: number,
  isRestDay: boolean,
  dayNumber: number,
): number {
  const wave = Math.sin(dayNumber * 0.7) * 40; // نوسان ملایم
  const restAdjust = isRestDay ? -120 : 30;
  return Math.round((base + wave + restAdjust) / 10) * 10;
}

/* -------------------------------------------------------------------------- */
/*  Volume by Goal + Level + Week progression                                 */
/* -------------------------------------------------------------------------- */

function getVolume(
  goal: Goal,
  level: Plan["level"],
  week: number, // 1..5
): { sets: number; reps: string; restSeconds: number; exerciseCount: number } {
  // پایه بر اساس level
  let sets = level === "beginner" ? 3 : level === "intermediate" ? 4 : 4;
  let reps =
    level === "beginner"
      ? "۱۲-۱۵"
      : level === "intermediate"
        ? "۱۰-۱۲"
        : "۸-۱۰";
  let rest = level === "beginner" ? 60 : level === "intermediate" ? 75 : 90;
  let count = level === "beginner" ? 4 : 5;

  // تنظیم بر اساس goal
  if (goal === "build_muscle") {
    sets = Math.min(sets + 1, 5);
    reps = level === "advanced" ? "۶-۱۰" : "۸-۱۲";
    rest = Math.min(rest + 15, 120);
    count = Math.min(count + 1, 6);
  } else if (goal === "lose_weight" || goal === "endurance") {
    reps = "۱۲-۱۵";
    rest = Math.max(rest - 15, 45);
    count = Math.min(count + 1, 6);
  } else if (goal === "general_fitness") {
    count = 5;
  }

  // پیشرفت تدریجی هفته‌ای
  if (week >= 3) {
    sets = Math.min(sets + 1, 5);
  }
  if (week >= 4) {
    count = Math.min(count + 1, 6);
  }

  return { sets, reps, restSeconds: rest, exerciseCount: count };
}

/* -------------------------------------------------------------------------- */
/*  Smart Rest Days                                                           */
/* -------------------------------------------------------------------------- */

/**
 * الگوی هوشمند:
 * - مبتدی: تقریباً هر ۳–۴ روز یک ریکاوری
 * - متوسط: هر ۴–۵ روز
 * - پیشرفته: هر ۵–۶ روز + یک ریکاوری کامل در هفته
 * - هرگز دو روز ریکاوری پشت‌سرهم (مگر هفته آخر)
 */
function isSmartRestDay(dayNumber: number, level: Plan["level"]): boolean {
  if (dayNumber === 30) return true; // روز آخر همیشه ریکاوری سبک

  const cycle = level === "beginner" ? 4 : level === "intermediate" ? 5 : 6;

  // روزهای مشخص ریکاوری
  if (dayNumber % cycle === 0) return true;

  // یک ریکاوری اضافی در میانه ماه برای جلوگیری از overtraining
  if (dayNumber === 15 || dayNumber === 22) return true;

  return false;
}

/* -------------------------------------------------------------------------- */
/*  Day patterns                                                              */
/* -------------------------------------------------------------------------- */

const DAY_PATTERNS = [
  { keys: ["push", "core"], focus: "سینه و شانه", title: "بالاتنه فشار" },
  { keys: ["pull", "core"], focus: "پشت و بازو", title: "بالاتنه کشش" },
  { keys: ["legs", "core"], focus: "پا و باسن", title: "پایین تنه" },
  {
    keys: ["cardio", "core", "legs"],
    focus: "کل بدن و قلب",
    title: "تمرین ترکیبی",
  },
  { keys: ["push", "pull"], focus: "بالاتنه کامل", title: "بالاتنه کامل" },
  {
    keys: ["legs", "glutes", "core"],
    focus: "پا و میان‌تنه",
    title: "پایین تنه قدرتی",
  },
];

/* -------------------------------------------------------------------------- */
/*  Pick exercises                                                            */
/* -------------------------------------------------------------------------- */

function filterByEquipment(list: PoolItem[], equipment: Equipment): PoolItem[] {
  return list.filter((ex) => {
    if (equipment === "home") return ex.home;
    if (equipment === "gym") return ex.gym;
    return true; // both
  });
}

function pickExercises(
  poolKeys: string[],
  equipment: Equipment,
  count: number,
  level: Plan["level"],
  volume: { sets: number; reps: string; restSeconds: number },
): PlanExercise[] {
  const all = poolKeys.flatMap((k) =>
    filterByEquipment(EXERCISE_POOL[k] || [], equipment),
  );

  // فیلتر بر اساس سطح (مبتدی حرکات خیلی سخت نگیرد)
  const maxDiff = level === "beginner" ? 2 : 3;
  const filtered = all.filter((ex) => ex.difficulty <= maxDiff);

  const selected = pickRandom(filtered.length > 0 ? filtered : all, count);

  return selected.map((ex) => ({
    exerciseId: ex.id,
    name: ex.name,
    muscle: MUSCLE_FA[ex.muscle] || ex.muscle,
    sets: volume.sets,
    reps: volume.reps,
    restSeconds: volume.restSeconds,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Build single day                                                          */
/* -------------------------------------------------------------------------- */

function buildDay(
  dayNumber: number,
  goal: Goal,
  equipment: Equipment,
  level: Plan["level"],
  baseCalories: number,
): PlanDay {
  const week = Math.ceil(dayNumber / 7);
  const rest = isSmartRestDay(dayNumber, level);
  const volume = getVolume(goal, level, week);
  const meals = buildMealsForDay(goal, dayNumber);
  const calories = dailyCalories(baseCalories, rest, dayNumber);

  if (rest) {
    // روز ریکاوری: فقط core سبک یا کشش
    const lightCore = pickExercises(["core"], equipment, 2, "beginner", {
      sets: 2,
      reps: "۳۰-۴۵ ثانیه",
      restSeconds: 30,
    });

    return {
      dayNumber,
      title: "روز ریکاوری",
      focus: "استراحت فعال · کشش · بازسازی",
      isRestDay: true,
      estimatedMinutes: 15 + Math.floor(Math.random() * 10),
      exercises: lightCore,
      meals,
      dailyCaloriesTarget: calories,
    };
  }

  // روز تمرینی
  const patternIndex =
    (dayNumber + Math.floor(Math.random() * 2)) % DAY_PATTERNS.length;
  const pattern = DAY_PATTERNS[patternIndex];

  // برای endurance و lose_weight کمی cardio بیشتر
  const keys = [...pattern.keys];
  if (
    (goal === "endurance" || goal === "lose_weight") &&
    !keys.includes("cardio")
  ) {
    keys.push("cardio");
  }

  const exercises = pickExercises(
    keys,
    equipment,
    volume.exerciseCount,
    level,
    volume,
  );

  const estimatedMinutes =
    level === "beginner"
      ? 30 + exercises.length * 4
      : level === "intermediate"
        ? 40 + exercises.length * 5
        : 50 + exercises.length * 5;

  return {
    dayNumber,
    title: pattern.title,
    focus: pattern.focus,
    isRestDay: false,
    estimatedMinutes: clamp(estimatedMinutes, 25, 75),
    exercises,
    meals,
    dailyCaloriesTarget: calories,
  };
}

/* -------------------------------------------------------------------------- */
/*  Main export                                                               */
/* -------------------------------------------------------------------------- */

const GOAL_TITLES: Record<Goal, string> = {
  lose_weight: "برنامه کاهش وزن ۳۰ روزه",
  build_muscle: "برنامه عضله‌سازی ۳۰ روزه",
  maintain: "برنامه حفظ تناسب ۳۰ روزه",
  endurance: "برنامه استقامت ۳۰ روزه",
  general_fitness: "برنامه آمادگی عمومی ۳۰ روزه",
};

const LEVEL_FA: Record<Plan["level"], string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export function generatePlan(input: GenerateInput): Plan {
  const { userId, bodyInfo, equipment, goal } = input;

  const level = getLevel(bodyInfo, goal);
  const baseCalories = getBaseCalorieTarget(bodyInfo, goal);
  const startDate = new Date().toISOString().split("T")[0];

  const days: PlanDay[] = [];
  for (let d = 1; d <= 30; d++) {
    days.push(buildDay(d, goal, equipment, level, baseCalories));
  }

  return {
    id: `plan_${userId}_${Date.now()}`,
    userId,
    goal,
    equipment,
    level,
    title: GOAL_TITLES[goal],
    description: `برنامه شخصی‌سازی‌شده ${LEVEL_FA[level]} برای هدف «${GOAL_TITLES[goal]}». حرکات و حجم بر اساس سطح و تجهیزات تو تنظیم شده.`,
    startDate,
    durationDays: 30,
    days,
    createdAt: new Date().toISOString(),
    source: "ai",
    coachId: null,
  };
}
