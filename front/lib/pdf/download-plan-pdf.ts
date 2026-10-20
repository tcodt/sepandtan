import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { Plan } from "@/lib/types/plan";
import type { PlanAccess } from "@/lib/types/access";
import { PlanPdfDocument } from "./plan-document";
import { registerPdfFonts } from "./register-fonts";

function safeFileName(title: string) {
  return (
    title
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-_]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "plan"
  );
}

export async function downloadPlanPdf(options: {
  plan: Plan;
  access?: PlanAccess | null;
  userName?: string;
}): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("دانلود PDF فقط در مرورگر ممکن است");
  }

  registerPdfFonts();

  const { plan, access, userName } = options;

  const element = createElement(PlanPdfDocument, {
    plan,
    access: access ?? null,
    userName,
  });

  const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sepandtan-${safeFileName(plan.title)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
