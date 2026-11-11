export const SUBSCRIPTION_QUEUE = 'subscription-queue';
export const SUBSCRIPTION_SCAN_JOB = 'subscription-lifecycle-scan';
export const SUBSCRIPTION_SCHEDULER_ID = 'subscription-lifecycle-scheduler';

/** ۰۳:۳۰ و ۱۵:۳۰ به وقت تهران (خارج از پیک) */
export const SUBSCRIPTION_SCAN_CRON = '30 3,15 * * *';
export const SUBSCRIPTION_SCAN_TZ = 'Asia/Tehran';

export const SUBSCRIPTION_BATCH = 500;
export const SUBSCRIPTION_MAX_BATCHES_PER_RUN = 20;
export const PENDING_GRACE_DAYS = 7;