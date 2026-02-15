/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ruler,
  Package,
  Tag,
  Scale,
  Palette,
  Droplet,
  Calendar,
  Shield,
  Globe,
  Truck,
  Award,
  Leaf,
  Factory,
  Hash,
  FlaskConical,
  Heart,
  AlertCircle,
  CheckCircle2,
  Thermometer,
  Sun,
  Snowflake,
  User,
  HashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Persian translations for product fields
const fieldTranslations: Record<string, string> = {
  material: "جنس",
  sizes: "سایزهای موجود",
  color: "رنگ",
  weight: "وزن",
  care: "نحوه نگهداری",
  brand: "برند",
  madeIn: "کشور سازنده",
  warranty: "گارانتی",
  season: "فصل مناسب",
  gender: "مناسب برای",
  servingSize: "اندازه وعده",
  servingsPerPackage: "تعداد وعده",
  protein: "پروتئین",
  calories: "کالری",
  ingredients: "ترکیبات",
  flavor: "طعم",
  expiryMonths: "ماندگاری",
  usage: "روش مصرف",
  storage: "شرایط نگهداری",
  allergen: "هشدار آلرژن",
  aminoProfile: "پروفایل آمینواسید",
  suitable: "مناسب برای",
  carbs: "کربوهیدرات",
  fat: "چربی",
  diameter: "قطر دسته",
  length: "طول",
  grip: "نوع دسته",
  features: "ویژگی‌ها",
  shape: "شکل",
  application: "کاربرد",
  dimensions: "ابعاد",
  capacity: "ظرفیت",
  inStock: "موجودی",
  rating: "امتیاز",
  reviews: "تعداد نظرات",
  discount: "تخفیف",
  certification: "گواهی‌نامه",
  returnPolicy: "بازگشت کالا",
  shippingDays: "زمان ارسال",
  sku: "کد محصول",
};

// Icon mapping for different field types
const getFieldIcon = (key: string) => {
  const iconMap: Record<string, any> = {
    material: Factory,
    sizes: Ruler,
    color: Palette,
    weight: Scale,
    care: Droplet,
    brand: Tag,
    madeIn: Globe,
    warranty: Shield,
    season: key === "تابستان" ? Sun : key === "زمستان" ? Snowflake : Calendar,
    gender: User,
    servingSize: Package,
    protein: FlaskConical,
    calories: Heart,
    ingredients: FlaskConical,
    flavor: Tag,
    expiryMonths: Calendar,
    usage: CheckCircle2,
    storage: Thermometer,
    allergen: AlertCircle,
    inStock: Package,
    rating: Award,
    discount: Tag,
    certification: Award,
    returnPolicy: Truck,
    shippingDays: Truck,
    sku: Hash,
  };

  const Icon = iconMap[key] || HashIcon;
  return <Icon className="w-4 h-4 mr-2 text-muted-foreground" />;
};

// Format value based on type
const formatValue = (key: string, value: any): string => {
  if (Array.isArray(value)) {
    return value.join("، ");
  }

  if (typeof value === "boolean") {
    return value ? "بله" : "خیر";
  }

  if (key === "price" || key === "discount") {
    return `${value.toLocaleString()} تومان`;
  }

  if (key === "rating") {
    return `${value} از ۵`;
  }

  if (key === "expiryMonths") {
    return `${value} ماه`;
  }

  if (key === "shippingDays") {
    return `${value} روز کاری`;
  }

  if (key === "returnPolicy") {
    return `${value} روز`;
  }

  if (key === "weight" && typeof value === "string" && !value.includes("g")) {
    return `${value} گرم`;
  }

  return String(value);
};

// Get badge color based on value using theme variables
const getValueBadge = (key: string, value: any) => {
  if (key === "inStock") {
    return value
      ? "bg-green-500/10 text-green-600 dark:text-green-400"
      : "bg-red-500/10 text-red-600 dark:text-red-400";
  }

  if (key === "gender") {
    if (value === "مردانه")
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (value === "زنانه")
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400";
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
  }

  if (key === "season") {
    if (value === "تابستان")
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    if (value === "زمستان")
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    return "bg-muted text-muted-foreground";
  }

  return "";
};

export default function ProductTabs({ product }: any) {
  // Filter out unwanted fields
  const excludeFields = [
    "id",
    "name",
    "description",
    "image",
    "longDescription",
  ];

  // Group fields by category
  const groupedFields = {
    basic: ["brand", "madeIn", "sku", "warranty", "certification"],
    physical: [
      "material",
      "color",
      "weight",
      "dimensions",
      "diameter",
      "length",
      "grip",
      "shape",
    ],
    apparel: ["sizes", "season", "gender", "care"],
    nutrition: [
      "servingSize",
      "servingsPerPackage",
      "protein",
      "carbs",
      "fat",
      "calories",
      "flavor",
      "expiryMonths",
      "suitable",
      "allergen",
    ],
    inventory: ["inStock", "rating", "reviews", "discount"],
    shipping: ["shippingDays", "returnPolicy"],
  };

  return (
    <Tabs defaultValue="specs" className="w-full" dir="rtl">
      <TabsList className="grid w-full grid-cols-2 rounded-xl p-1">
        <TabsTrigger
          value="specs"
          className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          مشخصات فنی
        </TabsTrigger>
        <TabsTrigger
          value="details"
          className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          توضیحات کامل
        </TabsTrigger>
      </TabsList>

      <TabsContent value="specs" className="mt-6">
        <Card className="p-6 rounded-2xl border-border bg-card shadow-lg bg-linear-to-br from-card to-muted/50">
          {/* Key specs at a glance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {product.inStock !== undefined && (
              <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border">
                <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">وضعیت</p>
                <p
                  className={`text-sm font-medium ${product.inStock ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {product.inStock ? "موجود" : "ناموجود"}
                </p>
              </div>
            )}

            {product.rating && (
              <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border">
                <Award className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xs text-muted-foreground">امتیاز</p>
                <p className="text-sm font-medium text-foreground">
                  {product.rating} از ۵
                </p>
              </div>
            )}

            {product.warranty && (
              <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border">
                <Shield className="w-5 h-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
                <p className="text-xs text-muted-foreground">گارانتی</p>
                <p className="text-sm font-medium text-foreground">
                  {product.warranty}
                </p>
              </div>
            )}

            {product.madeIn && (
              <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border">
                <Globe className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-muted-foreground">ساخت</p>
                <p className="text-sm font-medium text-foreground">
                  {product.madeIn}
                </p>
              </div>
            )}
          </div>

          {/* Detailed specifications in sections */}
          <div className="space-y-6">
            {/* Basic Information */}
            {Object.entries(product).filter(
              ([key]) =>
                !excludeFields.includes(key) &&
                groupedFields.basic.includes(key),
            ).length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center text-foreground">
                  <span className="w-1 h-6 bg-primary rounded-full mr-2"></span>
                  اطلاعات پایه
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product)
                    .filter(
                      ([key]) =>
                        !excludeFields.includes(key) &&
                        groupedFields.basic.includes(key),
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start p-3 bg-card rounded-xl border border-border hover:shadow-md hover:bg-accent/5 transition-all"
                      >
                        <div className="shrink-0 mt-0.5">
                          {getFieldIcon(key)}
                        </div>
                        <div className="flex-1 mr-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {fieldTranslations[key] || key}
                          </p>
                          <p
                            className={`font-medium text-sm ${getValueBadge(key, value)}`}
                          >
                            {formatValue(key, value)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Physical Specifications */}
            {Object.entries(product).filter(
              ([key]) =>
                !excludeFields.includes(key) &&
                groupedFields.physical.includes(key),
            ).length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center text-foreground">
                  <span className="w-1 h-6 bg-primary rounded-full mr-2"></span>
                  مشخصات فیزیکی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product)
                    .filter(
                      ([key]) =>
                        !excludeFields.includes(key) &&
                        groupedFields.physical.includes(key),
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start p-3 bg-card rounded-xl border border-border hover:shadow-md hover:bg-accent/5 transition-all"
                      >
                        <div className="shrink-0 mt-0.5">
                          {getFieldIcon(key)}
                        </div>
                        <div className="flex-1 mr-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {fieldTranslations[key] || key}
                          </p>
                          {key === "color" && typeof value === "string" ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full border border-border"
                                style={{ backgroundColor: value }}
                              />
                              <span className="font-medium text-sm text-foreground">
                                {value}
                              </span>
                            </div>
                          ) : (
                            <p className="font-medium text-sm text-foreground">
                              {formatValue(key, value)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Apparel Specific */}
            {Object.entries(product).filter(
              ([key]) =>
                !excludeFields.includes(key) &&
                groupedFields.apparel.includes(key),
            ).length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center text-foreground">
                  <span className="w-1 h-6 bg-primary rounded-full mr-2"></span>
                  ویژگی‌های پوشاک
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product)
                    .filter(
                      ([key]) =>
                        !excludeFields.includes(key) &&
                        groupedFields.apparel.includes(key),
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start p-3 bg-card rounded-xl border border-border hover:shadow-md hover:bg-accent/5 transition-all"
                      >
                        <div className="shrink-0 mt-0.5">
                          {getFieldIcon(key)}
                        </div>
                        <div className="flex-1 mr-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {fieldTranslations[key] || key}
                          </p>
                          {key === "sizes" && Array.isArray(value) ? (
                            <div className="flex flex-wrap gap-1">
                              {value.map((size) => (
                                <Badge
                                  key={size}
                                  variant="outline"
                                  className="text-xs border-border"
                                >
                                  {size}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p
                              className={`font-medium text-sm ${getValueBadge(key, value)}`}
                            >
                              {formatValue(key, value)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Nutrition Specific */}
            {Object.entries(product).filter(
              ([key]) =>
                !excludeFields.includes(key) &&
                groupedFields.nutrition.includes(key),
            ).length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center text-foreground">
                  <span className="w-1 h-6 bg-primary rounded-full mr-2"></span>
                  اطلاعات تغذیه‌ای
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product)
                    .filter(
                      ([key]) =>
                        !excludeFields.includes(key) &&
                        groupedFields.nutrition.includes(key),
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start p-3 bg-card rounded-xl border border-border hover:shadow-md hover:bg-accent/5 transition-all"
                      >
                        <div className="shrink-0 mt-0.5">
                          {getFieldIcon(key)}
                        </div>
                        <div className="flex-1 mr-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {fieldTranslations[key] || key}
                          </p>
                          <p className="font-medium text-sm text-foreground">
                            {formatValue(key, value)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Nutrition Facts Box for supplements */}
                {(product.protein || product.calories) && (
                  <div className="mt-4 p-4 bg-card rounded-xl border-2 border-primary/20">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-foreground">
                      <FlaskConical className="w-4 h-4 text-primary" />
                      جدول ارزش غذایی (در هر وعده)
                    </h4>
                    <div className="space-y-2">
                      {product.servingSize && (
                        <div className="flex justify-between text-sm border-b border-border pb-1">
                          <span className="text-muted-foreground">
                            اندازه وعده
                          </span>
                          <span className="font-medium text-foreground">
                            {product.servingSize}
                          </span>
                        </div>
                      )}
                      {product.protein && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">پروتئین</span>
                          <span className="font-medium text-foreground">
                            {product.protein}
                          </span>
                        </div>
                      )}
                      {product.carbs && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            کربوهیدرات
                          </span>
                          <span className="font-medium text-foreground">
                            {product.carbs}
                          </span>
                        </div>
                      )}
                      {product.fat && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">چربی</span>
                          <span className="font-medium text-foreground">
                            {product.fat}
                          </span>
                        </div>
                      )}
                      {product.calories && (
                        <div className="flex justify-between text-sm font-bold border-t border-border pt-1 mt-1">
                          <span className="text-muted-foreground">کالری</span>
                          <span className="text-primary">
                            {product.calories}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="p-4 bg-linear-to-r from-primary/5 to-transparent rounded-xl border border-border">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  ترکیبات تشکیل‌دهنده
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map(
                    (ingredient: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1 text-sm bg-secondary text-secondary-foreground"
                      >
                        {ingredient}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            {product.features && (
              <div className="p-4 bg-linear-to-r from-green-500/5 to-transparent rounded-xl border border-border">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                  <Award className="w-4 h-4 text-green-500" />
                  ویژگی‌های محصول
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.features.map((feature: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergen Warning */}
            {product.allergen && (
              <div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning mb-1">هشدار آلرژن</p>
                    <p className="text-sm text-warning/80">
                      {product.allergen}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Care Instructions */}
            {product.care && (
              <div className="p-4 bg-info/10 rounded-xl border border-info/20">
                <div className="flex items-start gap-3">
                  <Droplet className="w-5 h-5 text-info shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-info mb-1">
                      نحوه نگهداری و شستشو
                    </p>
                    <p className="text-sm text-info/80">{product.care}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Conditions */}
            {product.storage && (
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <Thermometer className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      شرایط نگهداری
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.storage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Instructions */}
            {product.usage && (
              <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-success mb-1">روش مصرف</p>
                    <p className="text-sm text-success/80">{product.usage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="details" className="mt-6">
        <Card className="p-8 rounded-2xl border-border bg-card shadow-lg bg-linear-to-br from-card to-muted/50">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {/* Main description */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center text-foreground">
                <span className="w-1 h-6 bg-primary rounded-full mr-3"></span>
                معرفی محصول
              </h3>
              <p className="leading-8 text-foreground/80 text-justify">
                {product.longDescription || product.description}
              </p>
            </div>

            {/* Additional details based on product type */}
            {product.category === "apparel" && (
              <div className="mt-6 p-6 bg-muted/50 rounded-xl border border-border">
                <h4 className="font-semibold mb-3 text-foreground">
                  راهنمای سایز
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  برای انتخاب سایز مناسب، می‌توانید از راهنمای سایز استفاده
                  کنید.
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Ruler className="w-4 h-4" />
                  مشاهده راهنمای سایز
                </Button>
              </div>
            )}

            {product.category === "nutrition" && (
              <div className="mt-6 p-6 bg-primary/25 rounded-xl border border-primary/50">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-success">
                  <Leaf className="w-5 h-5 text-green-500" />
                  توصیه‌های مصرف
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-success/80">
                  <li>پس از باز شدن، در جای خشک و خنک نگهداری شود</li>
                  <li>دور از دسترس کودکان نگهداری شود</li>
                  <li>همراه با آب کافی مصرف شود</li>
                  <li>
                    به عنوان مکمل غذایی و نه جایگزین وعده غذایی استفاده شود
                  </li>
                </ul>
              </div>
            )}

            {product.category === "equipment" && (
              <div className="mt-6 p-6 bg-info/10 rounded-xl border border-info/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-info">
                  <Shield className="w-5 h-5" />
                  نکات ایمنی
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-info/80">
                  <li>
                    قبل از استفاده از سلامت کامل تجهیزات اطمینان حاصل کنید
                  </li>
                  <li>برای جلوگیری از آسیب، از وزنه‌های مناسب استفاده کنید</li>
                  <li>در صورت مشاهده هرگونه خرابی، از استفاده خودداری کنید</li>
                </ul>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
