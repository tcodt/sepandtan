/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useMemo, useState, useCallback, useEffect, useId } from "react";
import {
  Search,
  Loader2,
  MoreHorizontal,
  UserX,
  Users,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  MinusCircle,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Pencil,
  Shield,
  Ban,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  UserPlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useAdminUsers,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useSoftDeleteAdminUser,
} from "@/features/admin/users/hooks/use-admin-users";
import type { BackendRole, BackendUserStatus } from "@/lib/types/api";
import type {
  AdminUser,
  AdminUsersFilters,
  UpdateAdminUserPayload,
} from "@/features/admin/users/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  canAdminAssignRole,
  getAdminRoleLock,
  lockFromRole,
  rememberAdminRoleLock,
} from "@/lib/role-lock";
import { CreateUserSheet } from "@/components/admin/users/create-user-sheet";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const ROLE_LABEL: Record<BackendRole, string> = {
  USER: "کاربر",
  ADMIN: "ادمین",
  SUPERADMIN: "سوپرادمین",
  AUTHOR: "نویسنده",
  COACH: "مربی",
  STORE: "فروشنده",
};

const ROLE_ICON: Record<BackendRole, typeof Shield> = {
  USER: Users,
  ADMIN: Shield,
  SUPERADMIN: Shield,
  AUTHOR: Pencil,
  COACH: CheckCircle2,
  STORE: Inbox,
};

const STATUS_LABEL: Record<BackendUserStatus, string> = {
  ACTIVE: "فعال",
  SUSPENDED: "معلق",
  DELETED: "حذف‌شده",
};

const STATUS_STYLES: Record<BackendUserStatus, string> = {
  ACTIVE:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  SUSPENDED:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  DELETED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
};

const ROLE_STYLES: Record<BackendRole, string> = {
  USER: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25",
  COACH: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
  STORE:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25",
  AUTHOR:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  ADMIN: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
  SUPERADMIN:
    "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40",
};

const editSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر"),
  email: z.string().email("ایمیل نامعتبر").or(z.literal("")),
  phone: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 6, "رمز حداقل ۶ کاراکتر"),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN", "AUTHOR", "COACH", "STORE"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
});

type EditFormValues = z.infer<typeof editSchema>;

type SortField = "name" | "createdAt" | "updatedAt";
type SortDir = "asc" | "desc";

/* -------------------------------------------------------------------------- */
/* Confirm Dialog                                                             */
/* -------------------------------------------------------------------------- */

type ConfirmIntent = "danger" | "warning" | "primary";

type ConfirmOptions = {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: ConfirmIntent;
  icon?: React.ComponentType<{ className?: string }>;
};

type ConfirmState =
  | (ConfirmOptions & {
      action: () => Promise<void> | void;
      isPending?: boolean;
    })
  | null;

const INTENT_STYLES: Record<ConfirmIntent, string> = {
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  warning: "bg-amber-600 text-white hover:bg-amber-600/90",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
};

const INTENT_ICON_STYLES: Record<ConfirmIntent, string> = {
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  primary: "border-primary/25 bg-primary/10 text-primary",
};

function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmState;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const Icon = state?.icon ?? AlertTriangle;
  const intent = state?.intent ?? "danger";

  const handleConfirm = async () => {
    if (!state) return;
    setBusy(true);
    try {
      await state.action();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <AlertDialog
      open={!!state}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <AlertDialogContent
        dir="rtl"
        className="max-w-[calc(100vw-2rem)] sm:max-w-md"
      >
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                INTENT_ICON_STYLES[intent],
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-start">
                {state?.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-start">
                {state?.description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={(e) => {
              if (busy) e.preventDefault();
            }}
          >
            {state?.cancelLabel ?? "انصراف"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn("w-full sm:w-auto", INTENT_STYLES[intent])}
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {busy ? (
              <Loader2
                className="me-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Icon className="me-2 h-4 w-4" aria-hidden="true" />
            )}
            {state?.confirmLabel ?? "تأیید"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Verified Indicator                                                         */
/* -------------------------------------------------------------------------- */

function VerifiedIndicator({
  verified,
  label,
  icon: Icon,
}: {
  verified: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="text-muted-foreground">{label}</span>
      {verified ? (
        <CheckCircle2
          className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
      ) : (
        <MinusCircle
          className="h-3.5 w-3.5 text-muted-foreground"
          aria-hidden
        />
      )}
      <span className="sr-only">{verified ? "تأیید شده" : "تأیید نشده"}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Role / Status Badges                                                       */
/* -------------------------------------------------------------------------- */

function RoleBadge({ role }: { role: BackendRole }) {
  const Icon = ROLE_ICON[role];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-xs font-medium", ROLE_STYLES[role])}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {ROLE_LABEL[role]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: BackendUserStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-xs font-medium", STATUS_STYLES[status])}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "ACTIVE" && "bg-emerald-500",
          status === "SUSPENDED" && "bg-amber-500",
          status === "DELETED" && "bg-zinc-400",
        )}
        aria-hidden="true"
      />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* User Actions                                                               */
/* -------------------------------------------------------------------------- */

function UserActions({
  user,
  onEdit,
  onChangeRole,
  onChangeStatus,
  onSoftDelete,
  onDelete,
}: {
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser, role: BackendRole) => void;
  onChangeStatus: (user: AdminUser, status: BackendUserStatus) => void;
  onSoftDelete: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}) {
  const lock = getAdminRoleLock(user.id, user.role);
  const disableCoach = lock === "seller" || user.role === "STORE";
  const disableStore = lock === "coach" || user.role === "COACH";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`اقدامات ${user.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="me-2 h-3.5 w-3.5" aria-hidden="true" />
          ویرایش کامل
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          تغییر نقش
          {lock ? (
            <span className="mt-0.5 block text-[10px] font-normal">
              قفل: {lock === "coach" ? "مربی" : "فروشنده"}
            </span>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuItem
          disabled={user.role === "USER"}
          onClick={() => onChangeRole(user, "USER")}
        >
          کاربر عادی
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disableCoach || user.role === "COACH"}
          onClick={() => onChangeRole(user, "COACH")}
        >
          مربی
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disableStore || user.role === "STORE"}
          onClick={() => onChangeRole(user, "STORE")}
        >
          فروشنده
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={user.role === "ADMIN"}
          onClick={() => onChangeRole(user, "ADMIN")}
        >
          ادمین
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          وضعیت حساب
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={user.status === "ACTIVE"}
          onClick={() => onChangeStatus(user, "ACTIVE")}
        >
          فعال
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={user.status === "SUSPENDED"}
          onClick={() => onChangeStatus(user, "SUSPENDED")}
        >
          تعلیق
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={user.status === "DELETED"}
          className="text-amber-700 focus:text-amber-700 dark:text-amber-400 dark:focus:text-amber-400"
          onClick={() => onSoftDelete(user)}
        >
          حذف منطقی
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(user)}
        >
          <UserX className="me-2 h-3.5 w-3.5" aria-hidden="true" />
          حذف دائم از سرور
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit Sheet                                                                 */
/* -------------------------------------------------------------------------- */

function EditUserSheet({
  user,
  open,
  onOpenChange,
  onSubmit,
  isPending,
  isDesktop,
}: {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, payload: UpdateAdminUserPayload) => void;
  isPending: boolean;
  isDesktop: boolean;
}) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "USER",
      status: "ACTIVE",
    },
  });

  const roleValue = useWatch({ control: form.control, name: "role" });
  const statusValue = useWatch({ control: form.control, name: "status" });
  const isDirty = form.formState.isDirty;

  const requestClose = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) return;
      if (isDirty && !isPending) {
        const ok = window.confirm("تغییرات ذخیره‌نشده دارید. بستن بدون ذخیره؟");
        if (!ok) return;
      }
      onOpenChange(false);
    },
    [isDirty, isPending, onOpenChange],
  );

  useEffect(() => {
    if (!user) return;
    form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: "",
      role: user.role,
      status: user.status,
    });
  }, [user, form]);

  const lock = user ? getAdminRoleLock(user.id, user.role) : null;

  const handleSubmit = form.handleSubmit((values) => {
    if (!user) return;

    const gate = canAdminAssignRole(user.role, lock, values.role);
    if (!gate.ok) {
      toast.error(gate.message);
      return;
    }

    const payload: UpdateAdminUserPayload = {
      name: values.name.trim(),
      email: values.email.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      role: values.role,
      status: values.status,
    };
    if (values.password?.trim()) {
      payload.password = values.password.trim();
    }

    onSubmit(user.id, payload);
  });

  return (
    <Sheet open={open} onOpenChange={requestClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "flex flex-col overflow-y-auto p-4 md:p-8",
          "h-[75vh] rounded-t-3xl",
          "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
        )}
        dir="rtl"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>ویرایش کاربر</SheetTitle>
          <SheetDescription>
            اطلاعات کاربر را ویرایش کنید. تغییرات پس از ذخیره اعمال می‌شود.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex-1 space-y-4 px-1 pb-2"
        >
          <div className="space-y-2">
            <Label htmlFor="edit-name">نام</Label>
            <Input id="edit-name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">ایمیل</Label>
            <Input
              id="edit-email"
              type="email"
              dir="ltr"
              className="font-mono text-sm"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">موبایل</Label>
            <Input
              id="edit-phone"
              dir="ltr"
              className="font-mono text-sm"
              {...form.register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">رمز جدید (اختیاری)</Label>
            <Input
              id="edit-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="خالی = بدون تغییر"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>نقش</Label>
            <Select
              value={roleValue ?? "USER"}
              onValueChange={(v) =>
                form.setValue("role", v as BackendRole, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="USER">کاربر</SelectItem>
                <SelectItem value="COACH" disabled={lock === "seller"}>
                  مربی
                </SelectItem>
                <SelectItem value="STORE" disabled={lock === "coach"}>
                  فروشنده
                </SelectItem>
                <SelectItem value="AUTHOR">نویسنده</SelectItem>
                <SelectItem value="ADMIN">ادمین</SelectItem>
                <SelectItem value="SUPERADMIN">سوپرادمین</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>وضعیت</Label>
            <Select
              value={statusValue ?? "ACTIVE"}
              onValueChange={(v) =>
                form.setValue("status", v as BackendUserStatus, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="ACTIVE">فعال</SelectItem>
                <SelectItem value="SUSPENDED">معلق</SelectItem>
                <SelectItem value="DELETED">حذف منطقی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => requestClose(false)}
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  در حال ذخیره…
                </>
              ) : (
                "ذخیره تغییرات"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="p-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری کاربران…</span>
      <div className="space-y-2">
        <div className="flex gap-3 border-b border-border pb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ms-auto h-4 w-8" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5"
            style={{ opacity: 1 - i * 0.06 }}
          >
            <Skeleton className="h-4 w-24" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="ms-auto h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCardsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری کاربران…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-background p-4"
          style={{ opacity: 1 - i * 0.1 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-3 flex gap-4 border-t border-border pt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / Error States                                                       */
/* -------------------------------------------------------------------------- */

function EmptyState({
  hasFilters,
  onClear,
  onAdd,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
        <Users className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {hasFilters
            ? "کاربری با این فیلترها یافت نشد"
            : "هنوز کاربری وجود ندارد"}
        </p>
        <p className="text-xs text-muted-foreground">
          {hasFilters
            ? "عبارت جستجو یا فیلترهای نقش و وضعیت را تغییر دهید."
            : "اولین کاربر را بسازید تا این لیست پر شود."}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            پاک کردن فیلترها
          </Button>
        )}
        <Button size="sm" onClick={onAdd}>
          <UserPlus className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          افزودن کاربر
        </Button>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10">
        <AlertTriangle
          className="h-6 w-6 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          دریافت کاربران ناموفق بود
        </p>
        <p className="max-w-md text-xs text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
        )}
        تلاش دوباره
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bulk Actions                                                               */
/* -------------------------------------------------------------------------- */

type BulkAction =
  | { kind: "role"; role: BackendRole }
  | { kind: "status"; status: BackendUserStatus }
  | { kind: "softDelete" }
  | { kind: "hardDelete" };

type BulkResult = {
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
  failures: Array<{ name: string; reason: string }>;
  skips: Array<{ name: string; reason: string }>;
};

const BULK_ROLE_ITEMS: Array<{ role: BackendRole; label: string }> = [
  { role: "USER", label: "کاربر عادی" },
  { role: "COACH", label: "مربی" },
  { role: "STORE", label: "فروشنده" },
  { role: "ADMIN", label: "ادمین" },
];

const BULK_STATUS_ITEMS: Array<{
  status: BackendUserStatus;
  label: string;
}> = [
  { status: "ACTIVE", label: "فعال" },
  { status: "SUSPENDED", label: "تعلیق" },
];

function BulkActionsBar({
  count,
  onClearSelection,
  onRequestBulk,
  isBulkRunning,
}: {
  count: number;
  onClearSelection: () => void;
  onRequestBulk: (action: BulkAction) => void;
  isBulkRunning: boolean;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="اقدامات گروهی"
      className={cn(
        "sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition-colors",
        isBulkRunning
          ? "border-primary/40 bg-primary/10"
          : "border-primary/25 bg-primary/5",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        {isBulkRunning ? (
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-primary"
            aria-hidden="true"
          />
        ) : (
          <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        )}
        {count.toLocaleString("fa-IR")} مورد انتخاب شده
      </span>

      <span className="h-4 w-px bg-border" aria-hidden="true" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            disabled={isBulkRunning}
          >
            <Shield className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            تغییر نقش
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {BULK_ROLE_ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.role}
              onClick={() => onRequestBulk({ kind: "role", role: item.role })}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            disabled={isBulkRunning}
          >
            <CheckCircle2 className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            تغییر وضعیت
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {BULK_STATUS_ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.status}
              onClick={() =>
                onRequestBulk({ kind: "status", status: item.status })
              }
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
        disabled={isBulkRunning}
        onClick={() => onRequestBulk({ kind: "softDelete" })}
      >
        <Ban className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
        حذف منطقی
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-destructive hover:text-destructive"
        disabled={isBulkRunning}
        onClick={() => onRequestBulk({ kind: "hardDelete" })}
      >
        <Trash2 className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
        حذف دائم
      </Button>

      <div className="ms-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={onClearSelection}
          disabled={isBulkRunning}
        >
          <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          لغو انتخاب
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<BackendRole | "ALL">("ALL");
  const [status, setStatus] = useState<BackendUserStatus | "ALL">("ACTIVE");
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const searchId = useId();
  const filtersPanelId = useId();
  const resultCountId = useId();

  // SSR-safe media query — no hydration flash on Sheet side prop.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const filters: AdminUsersFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      order: sortDir,
      search: search || undefined,
      role,
      status,
    }),
    [page, pageSize, sortDir, search, role, status],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminUsers(filters);
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();
  const softDeleteMutation = useSoftDeleteAdminUser();

  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasActiveFilters = !!search || role !== "ALL" || status !== "ACTIVE";

  // Debounced live search — 350ms, resets page.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch((prev) => {
        const next = searchInput.trim();
        if (next !== prev) setPage(1);
        return next;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Clear selection when page/filters change.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, pageSize, search, role, status]);

  // Clamp page when total shrinks (e.g. after delete).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setSearch("");
    setSearchInput("");
    setRole("ALL");
    setStatus("ACTIVE");
    setPage(1);
  }, []);

  const toggleSort = useCallback((field: SortField) => {
    setSortField(field);
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  }, []);

  /* ---------------------------- Selection ---------------------------- */
  const allOnPageSelected =
    users.length > 0 && users.every((u) => selectedIds.has(u.id));

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (users.every((u) => prev.has(u.id))) {
        const next = new Set(prev);
        users.forEach((u) => next.delete(u.id));
        return next;
      }
      const next = new Set(prev);
      users.forEach((u) => next.add(u.id));
      return next;
    });
  }, [users]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ---------------------------- Role change ---------------------------- */
  const requestRoleChange = useCallback(
    (user: AdminUser, newRole: BackendRole) => {
      if (user.role === newRole) return;

      const lock = getAdminRoleLock(user.id, user.role);
      const gate = canAdminAssignRole(user.role, lock, newRole);
      if (!gate.ok) {
        toast.error(gate.message);
        return;
      }

      const currentLabel = ROLE_LABEL[user.role] ?? user.role;
      const nextLabel = ROLE_LABEL[newRole] ?? newRole;

      const isDemoteStore = user.role === "STORE" && newRole === "USER";
      const isPromoteStore = newRole === "STORE";
      const isPromoteCoach = newRole === "COACH";
      const isDemoteCoach = user.role === "COACH" && newRole === "USER";

      const intent: ConfirmIntent =
        isDemoteStore || isDemoteCoach ? "warning" : "primary";

      setConfirm({
        title: "تغییر نقش کاربر",
        description: (
          <span className="block space-y-2">
            <span className="block">
              نقش «{user.name}» از{" "}
              <strong className="text-foreground">{currentLabel}</strong> به{" "}
              <strong className="text-foreground">{nextLabel}</strong> تغییر
              می‌کند.
            </span>

            {isDemoteStore && (
              <span className="block rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-100">
                دسترسی پنل فروشنده پس از همگام‌سازی پروفایل قطع می‌شود. کاربر
                نباید به onboarding تناسب‌اندام برود (قفل فروشنده حفظ می‌شود).
              </span>
            )}
            {isPromoteStore && (
              <span className="block rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-900 dark:text-emerald-100">
                اگر کاربر آنلاین باشد و روی onboarding یا dashboard باشد، به
                مسیر <span className="font-mono">/seller</span> هدایت می‌شود.
              </span>
            )}
            {isDemoteCoach && (
              <span className="block rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-100">
                دسترسی پنل مربی قطع می‌شود. قفل مربی برای جلوگیری از تبدیل به
                فروشنده حفظ می‌شود.
              </span>
            )}
            {isPromoteCoach && (
              <span className="block rounded-lg border border-sky-500/25 bg-sky-500/10 px-2.5 py-2 text-xs text-sky-900 dark:text-sky-100">
                کاربر به‌عنوان مربی علامت‌گذاری می‌شود (قفل coach).
              </span>
            )}
          </span>
        ),
        confirmLabel: "ثبت نقش",
        intent,
        icon: Shield,
        action: async () => {
          await updateMutation.mutateAsync(
            { id: user.id, payload: { role: newRole } },
            {
              onSuccess: () => {
                const nextLock = lockFromRole(newRole);
                if (nextLock) rememberAdminRoleLock(user.id, nextLock);

                if (isDemoteStore) {
                  toast.success(
                    "نقش USER شد — پنل فروشنده برای کاربر بسته می‌شود",
                  );
                } else if (isPromoteStore) {
                  toast.success(
                    "نقش STORE شد — کاربر به پنل فروشنده منتقل می‌شود",
                  );
                } else if (isPromoteCoach) {
                  toast.success("نقش مربی ثبت شد");
                } else if (isDemoteCoach) {
                  toast.success("نقش USER شد — دسترسی مربی قطع می‌شود");
                } else {
                  toast.success("نقش کاربر به‌روزرسانی شد");
                }
              },
            },
          );
        },
      });
    },
    [updateMutation],
  );

  /* --------------------------- Status change --------------------------- */
  const requestStatusChange = useCallback(
    (user: AdminUser, newStatus: BackendUserStatus) => {
      if (user.status === newStatus) return;

      const currentLabel = STATUS_LABEL[user.status] ?? user.status;
      const nextLabel = STATUS_LABEL[newStatus] ?? newStatus;

      const intent: ConfirmIntent =
        newStatus === "SUSPENDED"
          ? "warning"
          : newStatus === "DELETED"
            ? "danger"
            : "primary";

      const icon =
        newStatus === "SUSPENDED"
          ? Ban
          : newStatus === "DELETED"
            ? UserX
            : CheckCircle2;

      setConfirm({
        title: "تغییر وضعیت حساب",
        description: (
          <span className="block space-y-2">
            <span className="block">
              وضعیت «{user.name}» از «{currentLabel}» به «{nextLabel}» تغییر
              می‌کند.
            </span>
            {newStatus === "SUSPENDED" && (
              <span className="block rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-100">
                با همگام‌سازی پروفایل، کاربر از همه پنل‌ها خارج و به صفحه ورود
                با پیام تعلیق هدایت می‌شود.
              </span>
            )}
            {newStatus === "ACTIVE" && (
              <span className="block text-xs text-muted-foreground">
                حساب دوباره قابل ورود خواهد بود.
              </span>
            )}
            {newStatus === "DELETED" && (
              <span className="block rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                حذف منطقی: رکورد می‌ماند ولی ورود معمولاً مسدود است. برای حذف
                فیزیکی از «حذف دائم» استفاده کنید.
              </span>
            )}
          </span>
        ),
        confirmLabel:
          newStatus === "SUSPENDED"
            ? "تعلیق"
            : newStatus === "ACTIVE"
              ? "فعال‌سازی"
              : "ثبت وضعیت",
        intent,
        icon,
        action: async () => {
          await updateMutation.mutateAsync(
            { id: user.id, payload: { status: newStatus } },
            {
              onSuccess: () => {
                if (newStatus === "SUSPENDED") toast.success("حساب معلق شد");
                else if (newStatus === "ACTIVE") toast.success("حساب فعال شد");
                else toast.success("وضعیت کاربر به‌روزرسانی شد");
              },
            },
          );
        },
      });
    },
    [updateMutation],
  );

  /* ---------------------------- Soft delete ---------------------------- */
  const requestSoftDelete = useCallback(
    (user: AdminUser) => {
      setConfirm({
        title: "حذف منطقی کاربر",
        description: (
          <>
            «{user.name}» غیرفعال (حذف منطقی) می‌شود. حساب کاربر دیگر نمی‌تواند
            وارد شود، اما داده‌ها برای بازبینی باقی می‌مانند و امکان بازیابی
            وجود دارد.
          </>
        ),
        confirmLabel: "حذف منطقی",
        intent: "warning",
        icon: Ban,
        action: async () => {
          await softDeleteMutation.mutateAsync(user.id, {
            onSuccess: () => toast.success("کاربر غیرفعال شد"),
          });
        },
      });
    },
    [softDeleteMutation],
  );

  /* --------------------------- Permanent delete ------------------------ */
  const requestHardDelete = useCallback(
    (user: AdminUser) => {
      setConfirm({
        title: "حذف دائم کاربر",
        description: (
          <>
            «{user.name}» برای همیشه از پایگاه‌داده حذف می‌شود و دیگر نمی‌تواند
            وارد شود. این عملیات قابل بازگشت نیست. برای غیرفعال‌سازی موقت از
            «حذف منطقی» استفاده کنید.
          </>
        ),
        confirmLabel: "حذف دائم",
        intent: "danger",
        icon: UserX,
        action: async () => {
          await deleteMutation.mutateAsync(user.id, {
            onSuccess: () => toast.success("کاربر به‌طور دائم حذف شد"),
          });
        },
      });
    },
    [deleteMutation],
  );

  /* ----------------------------- Edit submit --------------------------- */
  const handleEditSubmit = useCallback(
    (id: string, payload: UpdateAdminUserPayload) => {
      updateMutation.mutate(
        { id, payload },
        {
          onSuccess: () => {
            if (payload.role) {
              const nextLock = lockFromRole(payload.role);
              if (nextLock) rememberAdminRoleLock(id, nextLock);
            }
            setEditingUser(null);
            toast.success("اطلاعات کاربر ذخیره شد");
          },
        },
      );
    },
    [updateMutation],
  );

  /* --------------------------- Bulk operations ------------------------- */

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.has(u.id)),
    [users, selectedIds],
  );

  const runBulk = useCallback(
    async (action: BulkAction): Promise<BulkResult> => {
      const targets = selectedUsers;
      const result: BulkResult = {
        attempted: targets.length,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        failures: [],
        skips: [],
      };

      const tasks = targets.map(async (user) => {
        try {
          if (action.kind === "role") {
            const lock = getAdminRoleLock(user.id, user.role);
            const gate = canAdminAssignRole(user.role, lock, action.role);
            if (!gate.ok) {
              result.skipped += 1;
              result.skips.push({ name: user.name, reason: gate.message });
              return;
            }
            await updateMutation.mutateAsync({
              id: user.id,
              payload: { role: action.role },
            });
            const nextLock = lockFromRole(action.role);
            if (nextLock) rememberAdminRoleLock(user.id, nextLock);
          } else if (action.kind === "status") {
            await updateMutation.mutateAsync({
              id: user.id,
              payload: { status: action.status },
            });
          } else if (action.kind === "softDelete") {
            await softDeleteMutation.mutateAsync(user.id);
          } else if (action.kind === "hardDelete") {
            await deleteMutation.mutateAsync(user.id);
          }
          result.succeeded += 1;
        } catch (err) {
          result.failed += 1;
          result.failures.push({
            name: user.name,
            reason: err instanceof Error ? err.message : "خطای نامشخص",
          });
        }
      });

      // Chunked execution: 5 concurrent requests at a time.
      const CHUNK = 5;
      for (let i = 0; i < tasks.length; i += CHUNK) {
        await Promise.all(tasks.slice(i, i + CHUNK));
      }

      return result;
    },
    [selectedUsers, updateMutation, softDeleteMutation, deleteMutation],
  );

  const summarizeBulk = useCallback((r: BulkResult): string => {
    const parts: string[] = [];
    if (r.succeeded) parts.push(`${r.succeeded} موفق`);
    if (r.skipped) parts.push(`${r.skipped} رد شده`);
    if (r.failed) parts.push(`${r.failed} ناموفق`);
    return parts.join(" · ") || "نتیجه‌ای ثبت نشد";
  }, []);

  const requestBulk = useCallback(
    (action: BulkAction) => {
      if (selectedUsers.length === 0) return;

      const n = selectedUsers.length;
      const namesPreview = selectedUsers
        .slice(0, 3)
        .map((u) => u.name)
        .join("، ");
      const more = n > 3 ? ` و ${n - 3} نفر دیگر` : "";

      const buildDescription = (extra?: React.ReactNode) => (
        <span className="block space-y-2">
          <span className="block">
            این عملیات روی <strong className="text-foreground">{n}</strong>{" "}
            کاربر انتخاب‌شده ({namesPreview}
            {more}) اعمال می‌شود.
          </span>
          {extra}
        </span>
      );

      let opts: ConfirmOptions & { action: () => Promise<void> | void };

      if (action.kind === "role") {
        const targetLabel = ROLE_LABEL[action.role];
        opts = {
          title: "تغییر گروهی نقش",
          description: buildDescription(
            <span className="block rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-100">
              کاربرانی که قفل مربی/فروشنده دارند رد می‌شوند و در گزارش نتیجه
              نمایش داده می‌شوند.
            </span>,
          ),
          confirmLabel: `تبدیل به ${targetLabel}`,
          intent: "primary",
          icon: Shield,
          action: async () => {
            setIsBulkRunning(true);
            try {
              const r = await runBulk(action);
              const summary = summarizeBulk(r);
              if (r.failed === 0 && r.skipped === 0) {
                toast.success(
                  `نقش ${r.succeeded} کاربر تغییر کرد — ${summary}`,
                );
              } else {
                toast.warning(`تغییر گروهی نقش: ${summary}`, {
                  description:
                    r.skips.length > 0
                      ? `رد شده‌ها: ${r.skips
                          .slice(0, 3)
                          .map((s) => s.name)
                          .join("، ")}${r.skips.length > 3 ? "…" : ""}`
                      : undefined,
                });
              }
              setSelectedIds(new Set());
            } finally {
              setIsBulkRunning(false);
            }
          },
        };
      } else if (action.kind === "status") {
        const targetLabel = STATUS_LABEL[action.status];
        opts = {
          title: "تغییر گروهی وضعیت",
          description: buildDescription(
            action.status === "SUSPENDED" ? (
              <span className="block rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-100">
                با همگام‌سازی پروفایل، کاربران انتخاب‌شده از پنل‌ها خارج و به
                صفحه ورود هدایت می‌شوند.
              </span>
            ) : (
              <span className="block text-xs text-muted-foreground">
                حساب‌ها دوباره قابل ورود خواهند بود.
              </span>
            ),
          ),
          confirmLabel: `تبدیل به ${targetLabel}`,
          intent: action.status === "SUSPENDED" ? "warning" : "primary",
          icon: action.status === "SUSPENDED" ? Ban : CheckCircle2,
          action: async () => {
            setIsBulkRunning(true);
            try {
              const r = await runBulk(action);
              const summary = summarizeBulk(r);
              if (r.failed === 0) {
                toast.success(
                  `وضعیت ${r.succeeded} کاربر تغییر کرد — ${summary}`,
                );
              } else {
                toast.warning(`تغییر گروهی وضعیت: ${summary}`);
              }
              setSelectedIds(new Set());
            } finally {
              setIsBulkRunning(false);
            }
          },
        };
      } else if (action.kind === "softDelete") {
        opts = {
          title: "حذف منطقی گروهی",
          description: buildDescription(
            <span className="block rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-100">
              حساب‌ها غیرفعال می‌شوند ولی رکورد باقی می‌ماند. قابل بازیابی است.
            </span>,
          ),
          confirmLabel: "حذف منطقی",
          intent: "warning",
          icon: Ban,
          action: async () => {
            setIsBulkRunning(true);
            try {
              const r = await runBulk(action);
              const summary = summarizeBulk(r);
              if (r.failed === 0) {
                toast.success(`${r.succeeded} کاربر غیرفعال شد — ${summary}`);
              } else {
                toast.warning(`حذف منطقی گروهی: ${summary}`);
              }
              setSelectedIds(new Set());
            } finally {
              setIsBulkRunning(false);
            }
          },
        };
      } else {
        opts = {
          title: "حذف دائم گروهی",
          description: buildDescription(
            <span className="block rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
              این عملیات قابل بازگشت نیست. فقط Super Admin مجاز است.
            </span>,
          ),
          confirmLabel: "حذف دائم",
          intent: "danger",
          icon: UserX,
          action: async () => {
            setIsBulkRunning(true);
            try {
              const r = await runBulk(action);
              const summary = summarizeBulk(r);
              if (r.failed === 0) {
                toast.success(
                  `${r.succeeded} کاربر برای همیشه حذف شد — ${summary}`,
                );
              } else {
                toast.warning(`حذف دائم گروهی: ${summary}`, {
                  description:
                    r.failures.length > 0
                      ? `ناموفق‌ها: ${r.failures
                          .slice(0, 3)
                          .map((f) => f.name)
                          .join("، ")}${r.failures.length > 3 ? "…" : ""}`
                      : undefined,
                });
              }
              setSelectedIds(new Set());
            } finally {
              setIsBulkRunning(false);
            }
          },
        };
      }

      setConfirm(opts);
    },
    [selectedUsers, runBulk, summarizeBulk],
  );

  const displayError =
    error instanceof Error ? error.message : "خطا در دریافت کاربران";

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8"
    >
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            مدیریت کاربران
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            مشاهده، ویرایش و مدیریت نقش و وضعیت کاربران پلتفرم
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 shrink-0 self-start sm:self-auto"
          onClick={() => setCreateOpen(true)}
        >
          <UserPlus className="me-1.5 h-4 w-4" aria-hidden="true" />
          کاربر جدید
        </Button>
      </header>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              جستجوی کاربران
            </label>
            <Input
              id={searchId}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput.trim());
                  setPage(1);
                } else if (e.key === "Escape" && searchInput) {
                  clearSearch();
                }
              }}
              placeholder="جستجوی نام، ایمیل یا موبایل…"
              className="h-10 ps-10 pe-10"
              aria-describedby={resultCountId}
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-e-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="پاک کردن جستجو"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            {isFetching && !isLoading && (
              <Loader2
                className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>

          <Button
            variant="outline"
            className="h-10 shrink-0 sm:hidden"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            aria-expanded={mobileFiltersOpen}
            aria-controls={filtersPanelId}
          >
            <SlidersHorizontal className="me-2 h-4 w-4" aria-hidden="true" />
            فیلتر
            {hasActiveFilters && (
              <span className="ms-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {(role !== "ALL" ? 1 : 0) + (status !== "ACTIVE" ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        <div
          id={filtersPanelId}
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-end",
            !mobileFiltersOpen && "hidden sm:flex",
          )}
        >
          <div className="w-full space-y-1.5 sm:w-40">
            <label className="text-xs font-medium text-muted-foreground">
              نقش
            </label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as BackendRole | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10" dir="rtl" aria-label="فیلتر نقش">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="ALL">همه</SelectItem>
                <SelectItem value="USER">کاربر</SelectItem>
                <SelectItem value="COACH">مربی</SelectItem>
                <SelectItem value="STORE">فروشنده</SelectItem>
                <SelectItem value="ADMIN">ادمین</SelectItem>
                <SelectItem value="SUPERADMIN">سوپرادمین</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-40">
            <label className="text-xs font-medium text-muted-foreground">
              وضعیت
            </label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as BackendUserStatus | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                dir="rtl"
                aria-label="فیلتر وضعیت"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="ACTIVE">فعال</SelectItem>
                <SelectItem value="SUSPENDED">معلق</SelectItem>
                <SelectItem value="DELETED">حذف‌شده (منطقی)</SelectItem>
                <SelectItem value="ALL">همه</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-36">
            <label className="text-xs font-medium text-muted-foreground">
              مرتب‌سازی
            </label>
            <Select
              value={sortDir}
              onValueChange={(v) => {
                setSortDir(v as SortDir);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10"
                dir="rtl"
                aria-label="جهت مرتب‌سازی"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="desc">جدیدترین</SelectItem>
                <SelectItem value="asc">قدیمی‌ترین</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="self-start sm:self-auto"
            >
              <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </section>

      {/* --------------------------- Result count --------------------------- */}
      <p
        id={resultCountId}
        className="text-xs text-muted-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        {isLoading
          ? "در حال بارگذاری…"
          : isError
            ? "—"
            : `${total.toLocaleString("fa-IR")} کاربر یافت شد${
                hasActiveFilters ? " (با فیلتر فعال)" : ""
              }`}
      </p>

      {/* --------------------------- Bulk actions --------------------------- */}
      <BulkActionsBar
        count={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onRequestBulk={requestBulk}
        isBulkRunning={isBulkRunning}
      />

      {/* ------------------------------ Table ------------------------------ */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <>
            <div className="md:hidden">
              <MobileCardsSkeleton />
            </div>
            <div className="hidden md:block">
              <TableSkeleton rows={8} />
            </div>
          </>
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        ) : users.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClear={handleReset}
            onAdd={() => toast.info("فرم ساخت کاربر را به‌زودی متصل می‌کنیم")}
          />
        ) : (
          <>
            {/* -------------------- Mobile cards -------------------- */}
            <div className="space-y-3 p-3 md:hidden">
              {users.map((user) => {
                const selected = selectedIds.has(user.id);
                return (
                  <article
                    key={user.id}
                    className={cn(
                      "rounded-xl border bg-background p-4 transition-colors",
                      selected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleOne(user.id)}
                          aria-label={`انتخاب ${user.name}`}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">
                            {user.name}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email || "—"}
                          </p>
                          <p
                            className="truncate text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {user.phone || "—"}
                          </p>
                        </div>
                      </div>
                      <UserActions
                        user={user}
                        onEdit={setEditingUser}
                        onChangeRole={requestRoleChange}
                        onChangeStatus={requestStatusChange}
                        onSoftDelete={requestSoftDelete}
                        onDelete={requestHardDelete}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <RoleBadge role={user.role} />
                      <StatusBadge status={user.status} />
                    </div>
                    <div className="mt-3 flex gap-4 border-t border-border pt-3">
                      <VerifiedIndicator
                        verified={user.isEmailVerified}
                        label="ایمیل"
                        icon={Mail}
                      />
                      <VerifiedIndicator
                        verified={user.isPhoneVerified}
                        label="موبایل"
                        icon={Phone}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            {/* -------------------- Desktop table -------------------- */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/75">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={toggleAll}
                        aria-label="انتخاب همه در این صفحه"
                      />
                    </TableHead>
                    <TableHead className="text-start">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        نام
                        {sortField === "name" ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-start">ارتباط</TableHead>
                    <TableHead className="text-start">نقش</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-start">تأیید</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const selected = selectedIds.has(user.id);
                    return (
                      <TableRow
                        key={user.id}
                        data-state={selected ? "selected" : undefined}
                        className={cn(
                          "transition-colors duration-150",
                          selected ? "bg-primary/5" : "hover:bg-muted/40",
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleOne(user.id)}
                            aria-label={`انتخاب ${user.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className="line-clamp-1 max-w-48">
                            {user.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <div
                              className="max-w-64 truncate"
                              title={user.email || "—"}
                            >
                              {user.email || "—"}
                            </div>
                            <div
                              dir="ltr"
                              className="max-w-48 truncate text-start"
                              title={user.phone || "—"}
                            >
                              {user.phone || "—"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <VerifiedIndicator
                              verified={user.isEmailVerified}
                              label="ایمیل"
                              icon={Mail}
                            />
                            <VerifiedIndicator
                              verified={user.isPhoneVerified}
                              label="موبایل"
                              icon={Phone}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserActions
                            user={user}
                            onEdit={setEditingUser}
                            onChangeRole={requestRoleChange}
                            onChangeStatus={requestStatusChange}
                            onSoftDelete={requestSoftDelete}
                            onDelete={requestHardDelete}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* -------------------- Pagination -------------------- */}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-2 flex items-center justify-between gap-3 sm:order-1 sm:justify-start">
                <p className="text-xs text-muted-foreground">
                  {total.toLocaleString("fa-IR")} کاربر
                  {isFetching && (
                    <span className="ms-1 inline-flex items-center gap-1">
                      <Loader2 className="inline h-3 w-3 animate-spin" />
                      در حال به‌روزرسانی…
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="page-size"
                    className="text-xs text-muted-foreground"
                  >
                    هر صفحه:
                  </label>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      id="page-size"
                      className="h-8 w-18 text-xs"
                      aria-label="تعداد ردیف در هر صفحه"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n.toLocaleString("fa-IR")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="order-1 flex items-center justify-center gap-2 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 flex-1 sm:flex-none"
                  aria-label="صفحه قبلی"
                >
                  <ChevronRight
                    className="me-1 h-4 w-4 sm:hidden"
                    aria-hidden="true"
                  />
                  <ChevronRight
                    className="me-1 hidden h-4 w-4 sm:inline"
                    aria-hidden="true"
                  />
                  قبلی
                </Button>
                <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                  {page.toLocaleString("fa-IR")} /{" "}
                  {totalPages.toLocaleString("fa-IR")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-9 flex-1 sm:flex-none"
                  aria-label="صفحه بعدی"
                >
                  بعدی
                  <ChevronLeft
                    className="ms-1 h-4 w-4 sm:hidden"
                    aria-hidden="true"
                  />
                  <ChevronLeft
                    className="ms-1 hidden h-4 w-4 sm:inline"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---------------------- Edit user (sheet) ---------------------- */}
      <EditUserSheet
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
        isDesktop={isDesktop}
      />

      {/* ---------------------- Create user (sheet) ---------------------- */}
      <CreateUserSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setPage(1)}
        isDesktop={isDesktop}
      />

      {/* ---------------------- Unified confirm ---------------------- */}
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
