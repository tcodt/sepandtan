
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const positiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const configServices = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  limit: {
    user: process.env.USER_LIMIT_PAGE || 10,
    brand: process.env.BRAND_LIMIT_PAGE || 10,
    review: process.env.REVIEW_LIMIT_PAGE || 10,
    bankAccount: process.env.BANKACCOUNT_LIMIT_PAGE || 10,
    cart: process.env.CART_LIMIT_PAGE || 10,
    category: process.env.CATEGORY_LIMIT_PAGE || 10,
    color: process.env.COLOR_LIMIT_PAGE || 10,
    discount: process.env.DISCOUNT_LIMIT_PAGE || 10,
    media: process.env.MEDIA_LIMIT_PAGE || 10,
    order: process.env.ORDER_LIMIT_PAGE || 10,
    product: process.env.PRODUCT_LIMIT_PAGE || 10,
    wishlist: process.env.WISHLIST_LIMIT_PAGE || 10,
    report: process.env.REPORT_LIMIT_PAGE || 10,
    province: process.env.PROVINCE_LIMIT_PAGE || 10,
    city: process.env.CITY_LIMIT_PAGE || 10,
    shipping: process.env.SHIPPING_LIMIT_PAGE || 10,
    store: process.env.STORE_LIMIT_PAGE || 10,
    storeReview: process.env.STORE_REVIEW_LIMIT_PAGE || 10,
    ticket:process.env.STORE_REVIEW_LIMIT_PAGE || 10,
    coach: process.env.CAOCH_LIMIT_PAGE || 10,
    food: process.env.FOOD_LIMIT_PAGE || 10,
    userPlan: process.env.USERPLAN_LIMIT_PAGE || 10,
    diet: process.env.DIET_LIMIT_PAGE || 10,
    trainingGoal: process.env.TRAININGGOAL_LIMIT_PAGE || 10,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessCookieName: process.env.JWT_ACCESS_TOKEN || 'access_token',
    refreshCookieName: process.env.JWT_REFRESH_TOKEN || 'refresh_token',
    expiresIn: process.env.JWT_EXPIRES_IN || '10h',
    accessTtlMs: positiveNumber(process.env.TOKEN_EXPIRES_ACCESS, 10) * DAY_MS,
    refreshTtlMs: positiveNumber(process.env.TOKEN_EXPIRES_REFRESH, 12) * HOUR_MS,
  },
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  ftp: {
    host: process.env.FTP_HOST || '',
    user: process.env.FTP_USER || '',
    password: process.env.FTP_PASSWORD || '',
    port: parseInt(process.env.FTP_PORT || '21', 10),
    baseUrl: process.env.MEDIA_BASE_URL || '',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION,
  },
});

export default configServices;
