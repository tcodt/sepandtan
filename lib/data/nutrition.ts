export type MealType = "breakfast" | "snack" | "lunch" | "dinner";

export type MealItem = {
  id: string;
  type: MealType;
  title: string;
  description: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type MealSlot = {
  type: MealType;
  label: string;
  timeLabel: string;
  alternatives: MealItem[];
};

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: "صبحانه",
  snack: "میان‌وعده",
  lunch: "ناهار",
  dinner: "شام",
};

/** برنامه نمونه یک روز — بعداً از AI/API می‌آید */
export const todayMealPlan: MealSlot[] = [
  {
    type: "breakfast",
    label: "صبحانه",
    timeLabel: "۷:۳۰ – ۹:۰۰",
    alternatives: [
      {
        id: "bf-1",
        type: "breakfast",
        title: "املت سبزیجات + نان سبوس‌دار",
        description: "۲ تخم‌مرغ، گوجه‌فرنگی، نان جو",
        calories: 380,
        protein: 22,
        carbs: 28,
        fat: 18,
      },
      {
        id: "bf-2",
        type: "breakfast",
        title: "یونانی با میوه و مغز",
        description: "ماست یونانی، موز، بادام",
        calories: 350,
        protein: 20,
        carbs: 35,
        fat: 12,
      },
      {
        id: "bf-3",
        type: "breakfast",
        title: "اوتمیل با کره بادام‌زمینی",
        description: "جو دوسر، شیر کم‌چرب، ۱ قاشق کره بادام‌زمینی",
        calories: 400,
        protein: 16,
        carbs: 48,
        fat: 14,
      },
    ],
  },
  {
    type: "snack",
    label: "میان‌وعده",
    timeLabel: "۱۰:۳۰ – ۱۱:۳۰",
    alternatives: [
      {
        id: "sn-1",
        type: "snack",
        title: "سیب + مشت بادام",
        description: "۱ سیب متوسط و ۱۰ عدد بادام",
        calories: 180,
        protein: 5,
        carbs: 22,
        fat: 9,
      },
      {
        id: "sn-2",
        type: "snack",
        title: "ماست کم‌چرب",
        description: "یک کاسه ماست و کمی عسل",
        calories: 150,
        protein: 12,
        carbs: 18,
        fat: 3,
      },
      {
        id: "sn-3",
        type: "snack",
        title: "نان و پنیر کم‌چرب",
        description: "۱ برش نان جو + پنیر",
        calories: 200,
        protein: 10,
        carbs: 24,
        fat: 7,
      },
    ],
  },
  {
    type: "lunch",
    label: "ناهار",
    timeLabel: "۱۳:۰۰ – ۱۴:۳۰",
    alternatives: [
      {
        id: "ln-1",
        type: "lunch",
        title: "سینه مرغ + برنج قهوه‌ای + سالاد",
        description: "۱۵۰ گرم مرغ، ۴ قاشق برنج، سبزیجات",
        calories: 520,
        protein: 42,
        carbs: 45,
        fat: 14,
      },
      {
        id: "ln-2",
        type: "lunch",
        title: "ماهی + سیب‌زمینی + سبزی",
        description: "ماهی سفید، سیب‌زمینی آب‌پز، سالاد",
        calories: 480,
        protein: 38,
        carbs: 40,
        fat: 12,
      },
      {
        id: "ln-3",
        type: "lunch",
        title: "عدسی + نان سبوس‌دار",
        description: "یک پیش‌دستی عدسی و نان جو",
        calories: 450,
        protein: 22,
        carbs: 60,
        fat: 8,
      },
    ],
  },
  {
    type: "dinner",
    label: "شام",
    timeLabel: "۱۹:۳۰ – ۲۱:۰۰",
    alternatives: [
      {
        id: "dn-1",
        type: "dinner",
        title: "خوراک مرغ و سبزیجات",
        description: "مرغ کبابی، کدو، هویج، Broccoli",
        calories: 420,
        protein: 36,
        carbs: 20,
        fat: 16,
      },
      {
        id: "dn-2",
        type: "dinner",
        title: "املت سفیده + سالاد",
        description: "۳ سفیده تخم‌مرغ، سبزیجات تازه",
        calories: 280,
        protein: 24,
        carbs: 10,
        fat: 12,
      },
      {
        id: "dn-3",
        type: "dinner",
        title: "سوپ سبزیجات + نان",
        description: "سوپ سبک و ۱ برش نان جو",
        calories: 320,
        protein: 12,
        carbs: 40,
        fat: 8,
      },
    ],
  },
];

export const dailyCalorieTarget = 2100;
