export const SETTLEMENT_QUEUE = 'settlement-queue';
export const SETTLEMENT_SCAN_JOB = 'settle-due-scan';
export const SETTLEMENT_SCHEDULER_ID = 'settle-due-scan-scheduler';

/** هر چند وقت یک‌بار ردیف‌های سررسیدشده بررسی شود (وقتی چیزی سررسید نشده = یک کوئری ایندکس‌دار) */
export const SETTLEMENT_SCAN_EVERY_MS = 60 * 60 * 1000; // ۱ ساعت

/** تعداد ردیف در هر batch و سقف batch در هر اجرا */
export const SETTLEMENT_BATCH = 200;
export const SETTLEMENT_MAX_BATCHES_PER_RUN = 25;

/**
 * true  → مبلغ خالص فروشنده از Order.payoutAmount خوانده می‌شود
 *         (وقتی ردیف SALE_SETTLEMENT مبلغ کل را دارد و کمیسیون/مالیات جدا کم می‌شود)
 * false → مبلغ خالص همان WalletTransaction.amount است (رفتار فعلی قبل از تغییرات)
 */
export const SETTLEMENT_USE_ORDER_PAYOUT = false;
