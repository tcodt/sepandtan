import type { Payment } from "@/lib/types/access";
import { PAYMENTS } from "@/lib/data/payments";

function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let payments: Payment[] = [...PAYMENTS];

export async function getUserPayments(userId: string): Promise<Payment[]> {
  await delay();
  return payments
    .filter((p) => p.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getPaymentSummary(userId: string) {
  await delay();
  const userPayments = payments.filter(
    (p) => p.userId === userId && p.status === "paid",
  );
  const totalPaid = userPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalPaid,
    paymentCount: userPayments.length,
    lastPayment: userPayments[0] ?? null,
  };
}

export function __resetPayments() {
  payments = [...PAYMENTS];
}
