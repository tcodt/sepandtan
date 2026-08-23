export type SelectedPlanDraft = {
  id: string;
  name: string;
  price: number;
};

const KEY = "sepandtan-selected-plan";

export function saveSelectedPlan(plan: SelectedPlanDraft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    // ignore
  }
}

export function readSelectedPlan(): SelectedPlanDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SelectedPlanDraft;
  } catch {
    return null;
  }
}

export function clearSelectedPlan() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
