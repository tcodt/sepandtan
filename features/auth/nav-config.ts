import type { LucideIcon } from "lucide-react";
import {
  Home,
  Store,
  Dumbbell,
  Sparkles,
  Info,
  Mail,
  LayoutDashboard,
  CircleUserRound,
  ShoppingCart,
  Heart,
  Settings,
  Package,
  Truck,
  MapPin,
  ClipboardList,
  Shield,
} from "lucide-react";

import type { UserProfile } from "@/lib/types/plan";
import { getHomePathForRole } from "@/features/onboarding/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AppRole = UserProfile["role"]; // trainee | coach | seller | admin

export type NavBadge = "cart" | "wishlist" | null;

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** اگر خالی/undefined → برای همه نقش‌ها (با رعایت authRequired) */
  roles?: readonly AppRole[];
  /** true = فقط کاربر لاگین‌شده */
  authRequired?: boolean;
  /** false = فقط مهمان */
  guestOnly?: boolean;
  /**
   * برای coach/seller: فقط وقتی roleStatus === "approved"
   * admin و trainee این فیلد را نادیده می‌گیرند
   */
  requireApprovedRole?: boolean;
  /** مخفی کردن برای قفل فروشنده/مربی (مثلاً مسیر fitness) */
  hideWhenProfessionalLock?: boolean;
  badge?: NavBadge;
  /** در نوار اصلی دسکتاپ */
  showInNavbar?: boolean;
  /** در sheet موبایل */
  showInMobile?: boolean;
  /** منوی حساب (dropdown) */
  showInAccountMenu?: boolean;
  /** لیست صفحه /account */
  showInAccountPage?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Public / primary links                                                     */
/* -------------------------------------------------------------------------- */

/**
 * لینک‌های نوار بالا + منوی موبایل
 * Coach/Wallet عمداً سنگین نیستند — coach فقط میانبر پنل
 */
export const PRIMARY_NAV: readonly NavItem[] = [
  {
    id: "home",
    href: "/",
    label: "خانه",
    icon: Home,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "store",
    href: "/store",
    label: "فروشگاه",
    icon: Store,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "workouts",
    href: "/workouts",
    label: "حرکات",
    icon: Dumbbell,
    // seller تأییدشده نیازی به کتابخانه حرکات در نوار اصلی ندارد
    roles: ["trainee", "coach", "admin"],
    hideWhenProfessionalLock: true,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "ai",
    href: "/ai",
    label: "هوش مصنوعی",
    icon: Sparkles,
    roles: ["trainee", "coach", "admin"],
    hideWhenProfessionalLock: true,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "about",
    href: "/about",
    label: "درباره ما",
    icon: Info,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "contact",
    href: "/contact",
    label: "تماس با ما",
    icon: Mail,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "seller-panel",
    href: "/seller",
    label: "پنل فروشنده",
    icon: Package,
    roles: ["seller"],
    authRequired: true,
    requireApprovedRole: true,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "coach-panel",
    href: "/coach",
    label: "پنل مربی",
    icon: Dumbbell,
    roles: ["coach"],
    authRequired: true,
    requireApprovedRole: true,
    showInNavbar: true,
    showInMobile: true,
  },
  {
    id: "admin-panel",
    href: "/admin",
    label: "پنل ادمین",
    icon: Shield,
    roles: ["admin"],
    authRequired: true,
    showInNavbar: true,
    showInMobile: true,
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Account menu / account page                                                */
/* -------------------------------------------------------------------------- */

export const ACCOUNT_NAV: readonly NavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard", // در resolve با getHomePathForRole جایگزین می‌شود
    label: "داشبورد",
    icon: LayoutDashboard,
    authRequired: true,
    showInAccountMenu: true,
    showInAccountPage: true,
    showInMobile: true,
  },
  {
    id: "account",
    href: "/account",
    label: "حساب کاربری",
    icon: CircleUserRound,
    authRequired: true,
    showInAccountMenu: true,
    showInAccountPage: false,
    showInMobile: true,
  },
  {
    id: "orders",
    href: "/account/orders",
    label: "سفارش‌های من",
    icon: ClipboardList,
    authRequired: true,
    roles: ["trainee", "admin"],
    showInAccountMenu: true,
    showInAccountPage: true,
  },
  {
    id: "addresses",
    href: "/account/addresses",
    label: "آدرس‌ها",
    icon: MapPin,
    authRequired: true,
    roles: ["trainee", "seller", "admin"],
    showInAccountMenu: true,
    showInAccountPage: true,
  },
  {
    id: "wishlist",
    href: "/wishlist",
    label: "علاقه‌مندی‌ها",
    icon: Heart,
    authRequired: true,
    roles: ["trainee", "admin"],
    badge: "wishlist",
    showInAccountMenu: true,
    showInAccountPage: true,
    showInMobile: true,
  },
  {
    id: "cart",
    href: "/cart",
    label: "سبد خرید",
    icon: ShoppingCart,
    authRequired: true,
    roles: ["trainee", "seller", "admin"],
    badge: "cart",
    showInAccountMenu: true,
    showInAccountPage: true,
    showInMobile: true,
  },
  {
    id: "seller-products",
    href: "/seller/products",
    label: "محصولات فروشگاه",
    icon: Package,
    authRequired: true,
    roles: ["seller"],
    requireApprovedRole: true,
    showInAccountMenu: true,
    showInAccountPage: true,
  },
  {
    id: "seller-orders",
    href: "/seller/orders",
    label: "سفارش‌های فروشگاه",
    icon: ClipboardList,
    authRequired: true,
    roles: ["seller"],
    requireApprovedRole: true,
    showInAccountMenu: true,
    showInAccountPage: true,
  },
  {
    id: "seller-shipping",
    href: "/seller/shipping",
    label: "روش‌های ارسال",
    icon: Truck,
    authRequired: true,
    roles: ["seller"],
    requireApprovedRole: true,
    showInAccountMenu: true,
    showInAccountPage: true,
  },
  {
    id: "settings",
    href: "/settings",
    label: "تنظیمات",
    icon: Settings,
    authRequired: true,
    showInAccountMenu: true,
    showInAccountPage: true,
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Visibility                                                                 */
/* -------------------------------------------------------------------------- */

export type NavContext = {
  user: UserProfile | null;
  isAuthenticated: boolean;
};

function roleAllowed(item: NavItem, role: AppRole | undefined): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (!role) return false;
  return item.roles.includes(role);
}

export function isNavItemVisible(item: NavItem, ctx: NavContext): boolean {
  const { user, isAuthenticated } = ctx;

  if (item.guestOnly && isAuthenticated) return false;
  if (item.authRequired && !isAuthenticated) return false;

  if (!isAuthenticated) {
    // مهمان: فقط آیتم‌های بدون auth و بدون roles محدود (یا roles خالی)
    if (item.authRequired) return false;
    if (item.roles && item.roles.length > 0) return false;
    return true;
  }

  if (!user) return false;

  const role = user.role;

  if (!roleAllowed(item, role)) return false;

  if (item.requireApprovedRole) {
    if (role === "seller" || role === "coach") {
      if (user.roleStatus && user.roleStatus !== "approved") return false;
    }
  }

  if (item.hideWhenProfessionalLock) {
    // seller قفل‌شده / سابق: لینک fitness را در نوار اصلی نشان نده
    if (
      user.professionalRoleLock === "seller" ||
      (role === "seller" && user.roleStatus === "approved")
    ) {
      return false;
    }
  }

  return true;
}

function resolveHref(item: NavItem, user: UserProfile | null): string {
  if (item.id === "dashboard" && user) {
    return getHomePathForRole(user.role);
  }
  return item.href;
}

export type ResolvedNavItem = NavItem & { href: string };

function filterAndResolve(
  items: readonly NavItem[],
  ctx: NavContext,
  predicate: (item: NavItem) => boolean,
): ResolvedNavItem[] {
  return items
    .filter((item) => predicate(item) && isNavItemVisible(item, ctx))
    .map((item) => ({ ...item, href: resolveHref(item, ctx.user) }));
}

/** لینک‌های نوار دسکتاپ */
export function getNavbarLinks(ctx: NavContext): ResolvedNavItem[] {
  return filterAndResolve(PRIMARY_NAV, ctx, (i) => Boolean(i.showInNavbar));
}

/** لینک‌های sheet موبایل (اصلی + چند میانبر حساب) */
export function getMobileNavLinks(ctx: NavContext): ResolvedNavItem[] {
  const primary = filterAndResolve(PRIMARY_NAV, ctx, (i) =>
    Boolean(i.showInMobile),
  );
  const accountExtras = filterAndResolve(ACCOUNT_NAV, ctx, (i) =>
    Boolean(i.showInMobile && i.id !== "account"),
  );
  // جلوگیری از تکرار href
  const seen = new Set(primary.map((i) => i.href));
  const merged = [...primary];
  for (const item of accountExtras) {
    if (!seen.has(item.href)) {
      seen.add(item.href);
      merged.push(item);
    }
  }
  return merged;
}

/** منوی dropdown حساب */
export function getAccountMenuLinks(ctx: NavContext): ResolvedNavItem[] {
  return filterAndResolve(ACCOUNT_NAV, ctx, (i) =>
    Boolean(i.showInAccountMenu),
  );
}

/** کارت‌ها / لیست صفحه حساب */
export function getAccountPageLinks(ctx: NavContext): ResolvedNavItem[] {
  return filterAndResolve(ACCOUNT_NAV, ctx, (i) =>
    Boolean(i.showInAccountPage),
  );
}

/** آیا سبد در اکشن‌بار navbar نشان داده شود */
export function showCartAction(ctx: NavContext): boolean {
  if (!ctx.isAuthenticated || !ctx.user) return false;
  const role = ctx.user.role;
  if (role === "coach") return false;
  return role === "trainee" || role === "seller" || role === "admin";
}

/** آیا wishlist در اکشن‌بار نشان داده شود */
export function showWishlistAction(ctx: NavContext): boolean {
  if (!ctx.isAuthenticated || !ctx.user) return false;
  return ctx.user.role === "trainee" || ctx.user.role === "admin";
}
