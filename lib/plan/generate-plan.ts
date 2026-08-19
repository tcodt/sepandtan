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

const EXERCISE_POOL: Record<
  string,
  { id: string; name: string; muscle: string; home: boolean; gym: boolean }[]
> = {
  push: [
    { id: "2", name: "شنا سوئدی", muscle: "chest", home: true, gym: true },
    {
      id: "7",
      name: "پرس سینه با دمبل",
      muscle: "chest",
      home: true,
      gym: true,
    },
    { id: "8", name: "دیپ روی صندلی", muscle: "arms", home: true, gym: true },
    {
      id: "9",
      name: "پرس سرشانه با دمبل",
      muscle: "shoulders",
      home: true,
      gym: true,
    },
  ],
  pull: [
    { id: "10", name: "بارفیکس منفی", muscle: "back", home: true, gym: true },
    { id: "11", name: "قایقی با کش", muscle: "back", home: true, gym: false },
    { id: "12", name: "لت پول‌داون", muscle: "back", home: false, gym: true },
    {
      id: "13",
      name: "فیس‌پول با کش",
      muscle: "shoulders",
      home: true,
      gym: true,
    },
  ],
  legs: [
    {
      id: "1",
      name: "اسکوات با وزن بدن",
      muscle: "legs",
      home: true,
      gym: true,
    },
    { id: "4", name: "لانگز معکوس", muscle: "legs", home: true, gym: true },
    {
      id: "5",
      name: "ددلیفت رومانیایی با دمبل",
      muscle: "legs",
      home: true,
      gym: true,
    },
    { id: "14", name: "هیپ تراست", muscle: "glutes", home: true, gym: true },
    { id: "15", name: "اسکوات گابلت", muscle: "legs", home: true, gym: true },
  ],
  core: [
    { id: "3", name: "پلانک", muscle: "core", home: true, gym: true },
    { id: "16", name: "کرانچ دوچرخه", muscle: "core", home: true, gym: true },
    { id: "17", name: "ددباگ", muscle: "core", home: true, gym: true },
  ],
  cardio: [
    { id: "6", name: "کوهنورد", muscle: "full_body", home: true, gym: true },
    { id: "18", name: "برپی", muscle: "full_body", home: true, gym: true },
    {
      id: "19",
      name: "جامپینگ جک",
      muscle: "full_body",
      home: true,
      gym: true,
    },
  ],
};

const MEAL_LOSE: PlanMeal[] = [
  {
    id: "m1",
    type: "breakfast",
    title: "املت سبزیجات + نان جو",
    description: "۲ تخم‌مرغ، گوجه، نان سبوس‌دار",
    calories: 320,
    protein: 22,
    carbs: 25,
    fat: 14,
  },
  {
    id: "m2",
    type: "snack",
    title: "سیب + ۱۰ بادام",
    description: "۱ سیب متوسط",
    calories: 160,
    protein: 4,
    carbs: 22,
    fat: 7,
  },
  {
    id: "m3",
    type: "lunch",
    title: "سینه مرغ گریل + سالاد",
    description: "۱۵۰گ مرغ، کاهو، خیار",
    calories: 380,
    protein: 40,
    carbs: 12,
    fat: 18,
  },
  {
    id: "m4",
    type: "dinner",
    title: "ماهی سفید + سبزیجات",
    description: "۱۵۰گ ماهی، بروکلی",
    calories: 340,
    protein: 35,
    carbs: 15,
    fat: 14,
  },
];

const MEAL_MUSCLE: PlanMeal[] = [
  {
    id: "m9",
    type: "breakfast",
    title: "جو دوسر + شیر + کره بادام + موز",
    description: "۵۰گ جو، ۲۰۰میل شیر",
    calories: 480,
    protein: 22,
    carbs: 55,
    fat: 18,
  },
  {
    id: "m10",
    type: "snack",
    title: "شیک پروتئین + موز",
    description: "۱ اسکوپ وی",
    calories: 280,
    protein: 28,
    carbs: 30,
    fat: 4,
  },
  {
    id: "m11",
    type: "lunch",
    title: "برنج + خورشت + گوشت",
    description: "پرس کامل",
    calories: 650,
    protein: 38,
    carbs: 70,
    fat: 22,
  },
  {
    id: "m12",
    type: "dinner",
    title: "سینه مرغ + سیب‌زمینی",
    description: "۲۰۰گ مرغ",
    calories: 520,
    protein: 45,
    carbs: 45,
    fat: 12,
  },
];

const MEAL_DEFAULT: PlanMeal[] = [
  {
    id: "m13",
    type: "breakfast",
    title: "نان و پنیر و گردو",
    description: "صبحانه سنتی",
    calories: 380,
    protein: 16,
    carbs: 35,
    fat: 18,
  },
  {
    id: "m14",
    type: "snack",
    title: "ماست + میوه",
    description: "۱ کاسه ماست",
    calories: 200,
    protein: 12,
    carbs: 25,
    fat: 5,
  },
  {
    id: "m15",
    type: "lunch",
    title: "چلو مرغ",
    description: "پرس معمولی",
    calories: 550,
    protein: 35,
    carbs: 60,
    fat: 15,
  },
  {
    id: "m16",
    type: "dinner",
    title: "سوپ جو + نان سبوس",
    description: "سوپ خانگی",
    calories: 320,
    protein: 14,
    carbs: 40,
    fat: 10,
  },
];

function mealsForGoal(goal: Goal): PlanMeal[] {
  if (goal === "lose_weight") return MEAL_LOSE;
  if (goal === "build_muscle") return MEAL_MUSCLE;
  return MEAL_DEFAULT;
}

function filterEq<T extends { home: boolean; gym: boolean }>(
  list: T[],
  equipment: Equipment,
): T[] {
  return list.filter((ex) => {
    if (equipment === "home") return ex.home;
    if (equipment === "gym") return ex.gym;
    return true;
  });
}

function pickExercises(
  poolKeys: string[],
  equipment: Equipment,
  count: number,
  level: Plan["level"],
): PlanExercise[] {
  const all = poolKeys.flatMap((k) =>
    filterEq(EXERCISE_POOL[k] || [], equipment),
  );
  const selected = all.slice(0, Math.max(count, 3));
  const sets = level === "beginner" ? 3 : 4;
  const reps =
    level === "beginner"
      ? "۱۲-۱۵"
      : level === "intermediate"
        ? "۱۰-۱۲"
        : "۸-۱۰";
  const rest = level === "beginner" ? 60 : 90;

  return selected.map((ex) => ({
    exerciseId: ex.id,
    name: ex.name,
    muscle: MUSCLE_FA[ex.muscle] || ex.muscle,
    sets,
    reps,
    restSeconds: rest,
  }));
}

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
  return "intermediate";
}

function getCalorieTarget(bodyInfo: BodyInfo, goal: Goal): number {
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

  let tdee = bmr * mul[activityLevel];
  if (goal === "lose_weight") tdee -= 400;
  if (goal === "build_muscle") tdee += 300;
  if (goal === "endurance") tdee += 200;

  return Math.round(tdee / 10) * 10;
}

function buildDay(
  dayNumber: number,
  goal: Goal,
  equipment: Equipment,
  level: Plan["level"],
  calorieTarget: number,
): PlanDay {
  const isRestDay = dayNumber % 7 === 0;
  const meals = mealsForGoal(goal).map((m, i) => ({
    ...m,
    id: `d${dayNumber}m${i + 1}`,
  }));

  if (isRestDay) {
    return {
      dayNumber,
      title: "روز ریکاوری",
      focus: "استراحت فعال و کشش",
      isRestDay: true,
      estimatedMinutes: 20,
      exercises: pickExercises(["core"], equipment, 2, "beginner").map((e) => ({
        ...e,
        sets: 2,
        reps: "۳۰-۴۵ ثانیه",
        restSeconds: 30,
      })),
      meals,
      dailyCaloriesTarget: calorieTarget,
    };
  }

  const patterns = [
    { keys: ["push", "core"], focus: "سینه و شانه", title: "بالاتنه فشار" },
    { keys: ["pull", "core"], focus: "پشت و بازو", title: "بالاتنه کشش" },
    { keys: ["legs", "core"], focus: "پا و باسن", title: "پایین تنه" },
    {
      keys: ["cardio", "core", "legs"],
      focus: "کل بدن",
      title: "تمرین ترکیبی",
    },
  ];
  const pattern = patterns[(dayNumber - 1) % patterns.length];

  return {
    dayNumber,
    title: pattern.title,
    focus: pattern.focus,
    isRestDay: false,
    estimatedMinutes: level === "beginner" ? 35 : 50,
    exercises: pickExercises(pattern.keys, equipment, 5, level),
    meals,
    dailyCaloriesTarget: calorieTarget,
  };
}

const GOAL_TITLES: Record<Goal, string> = {
  lose_weight: "برنامه کاهش وزن ۳۰ روزه",
  build_muscle: "برنامه عضله‌سازی ۳۰ روزه",
  maintain: "برنامه حفظ تناسب ۳۰ روزه",
  endurance: "برنامه استقامت ۳۰ روزه",
  general_fitness: "برنامه آمادگی عمومی ۳۰ روزه",
};

export function generatePlan(input: GenerateInput): Plan {
  const { userId, bodyInfo, equipment, goal } = input;
  const level = getLevel(bodyInfo, goal);
  const calorieTarget = getCalorieTarget(bodyInfo, goal);
  const startDate = new Date().toISOString().split("T")[0];

  const days: PlanDay[] = [];
  for (let d = 1; d <= 30; d++) {
    days.push(buildDay(d, goal, equipment, level, calorieTarget));
  }

  return {
    id: `plan_${userId}_${Date.now()}`,
    userId,
    goal,
    equipment,
    level,
    title: GOAL_TITLES[goal],
    description: `برنامه شخصی‌سازی‌شده برای هدف ${GOAL_TITLES[goal]}، سطح ${level}.`,
    startDate,
    durationDays: 30,
    days,
    createdAt: new Date().toISOString(),
    source: "ai",
    coachId: null,
  };
}
