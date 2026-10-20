import type { PlanDay } from "@/lib/types/plan";

/** فقط برای پر کردن mock وقتی days خالی است */
export function buildSampleDays(count = 7): PlanDay[] {
  const days: PlanDay[] = [];
  for (let i = 1; i <= count; i++) {
    const isRest = i % 7 === 0;
    days.push({
      dayNumber: i,
      title: isRest ? "استراحت" : `تمرین روز ${i}`,
      focus: isRest ? "recovery" : "full_body",
      isRestDay: isRest,
      estimatedMinutes: isRest ? 0 : 45,
      dailyCaloriesTarget: 2000,
      exercises: isRest
        ? []
        : [
            {
              exerciseId: "1",
              name: "اسکوات با وزن بدن",
              muscle: "legs",
              sets: 3,
              reps: "12",
              restSeconds: 60,
            },
            {
              exerciseId: "2",
              name: "شنا سوئدی",
              muscle: "chest",
              sets: 3,
              reps: "10",
              restSeconds: 45,
            },
            {
              exerciseId: "3",
              name: "پلانک",
              muscle: "core",
              sets: 3,
              reps: "45 ثانیه",
              restSeconds: 30,
            },
          ],
      meals: [
        {
          id: `d${i}-b`,
          type: "breakfast",
          title: "املت سبزیجات",
          description: "۲ تخم‌مرغ + نان سبوس",
          calories: 320,
        },
        {
          id: `d${i}-l`,
          type: "lunch",
          title: "سینه مرغ + سالاد",
          description: "۱۵۰گ مرغ",
          calories: 420,
        },
        {
          id: `d${i}-d`,
          type: "dinner",
          title: "ماهی + سبزیجات",
          description: "وعده سبک",
          calories: 380,
        },
      ],
    });
  }
  return days;
}
