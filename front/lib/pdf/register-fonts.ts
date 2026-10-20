import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * ثبت فونت فارسی/انگلیسی — فقط یک‌بار
 * از فونت موجود پروژه: public/fonts/iran-sans.ttf
 */
export function registerPdfFonts() {
  if (registered) return;
  if (typeof window === "undefined") return;

  Font.register({
    family: "IRANSans",
    fonts: [
      {
        src: "/fonts/iran-sans.ttf",
        fontWeight: "normal",
      },
      {
        src: "/fonts/iran-sans.ttf",
        fontWeight: "bold",
      },
    ],
  });

  // جلوگیری از شکستن غلط کلمات فارسی
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}