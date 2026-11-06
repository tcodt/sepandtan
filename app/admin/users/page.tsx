"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import {
  canAdminAssignRole,
  getAdminRoleLock,
  lockFromRole,
  rememberAdminRoleLock,
} from "@/lib/role-lock";
import { useMediaQuery } from "@/hooks/use-media-query";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<BackendRole, string> = {
  USER: "کاربر",
  ADMIN: "ادمین",
  SUPERADMIN: "سوپرادمین",
  AUTHOR: "نویسنده",
  COACH: "مربی",
  STORE: "فروشنده",
};

const STATUS_LABEL: Record<BackendUserStatus, string> = {
  ACTIVE: "فعال",
  SUSPENDED: "معلق",
  DELETED: "حذف‌شده",
};

const STATUS_STYLES: Record<BackendUserStatus, string> = {
  ACTIVE:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  SUSPENDED:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  DELETED: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20",
};

const ROLE_STYLES: Record<BackendRole, string> = {
  USER: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
  COACH: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  STORE:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  AUTHOR:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  ADMIN: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  SUPERADMIN:
    "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
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

/* -------------------------------------------------------------------------- */
/* Confirm Dialog (shadcn-only)                                               */
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
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  warning:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  primary: "border-primary/20 bg-primary/10 text-primary",
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
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
      ) : (
        <MinusCircle
          className="h-3.5 w-3.5 text-muted-foreground/50"
          aria-hidden
        />
      )}
      <span className="sr-only">{verified ? "تأیید شده" : "تأیید نشده"}</span>
    </div>
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
          className="h-9 w-9 shrink-0"
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
}: {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, payload: UpdateAdminUserPayload) => void;
  isPending: boolean;
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
  const isDesktop = useMediaQuery("(min-width: 768px)"); // md breakpoint

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "rounded-t-3xl overflow-y-auto p-4 md:p-8",
          // Mobile: bottom sheet look
          "h-[70vh] rounded-t-3xl",
          // Desktop: right-side panel look
          "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
        )}
        dir="rtl"
      >
        <SheetHeader>
          <SheetTitle>ویرایش کاربر</SheetTitle>
          <SheetDescription>
            اطلاعات کاربر را ویرایش کنید. تغییرات پس از ذخیره اعمال می‌شود.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 px-4 pb-4">
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
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isPending}
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
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<BackendRole | "ALL">("ALL");
  const [status, setStatus] = useState<BackendUserStatus | "ALL">("ACTIVE");
  const [searchInput, setSearchInput] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const filters: AdminUsersFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc",
      search: search || undefined,
      role,
      status,
    }),
    [page, search, role, status],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminUsers(filters);
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();
  const softDeleteMutation = useSoftDeleteAdminUser();

  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = !!search || role !== "ALL" || status !== "ALL";

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const handleReset = useCallback(() => {
    setSearch("");
    setSearchInput("");
    setRole("ALL");
    setStatus("ALL");
    setPage(1);
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

      setConfirm({
        title: "تغییر نقش کاربر",
        description: (
          <>
            نقش «{user.name}» از «{currentLabel}» به «{nextLabel}» تغییر می‌کند.
            آیا ادامه می‌دهید؟
          </>
        ),
        confirmLabel: "تغییر نقش",
        intent: "primary",
        icon: Shield,
        action: async () => {
          await updateMutation.mutateAsync(
            { id: user.id, payload: { role: newRole } },
            {
              onSuccess: () => {
                const nextLock = lockFromRole(newRole);
                if (nextLock) rememberAdminRoleLock(user.id, nextLock);
                toast.success("نقش کاربر به‌روزرسانی شد");
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
          <>
            وضعیت «{user.name}» از «{currentLabel}» به «{nextLabel}» تغییر
            می‌کند. آیا ادامه می‌دهید؟
          </>
        ),
        confirmLabel: "تغییر وضعیت",
        intent,
        icon,
        action: async () => {
          await updateMutation.mutateAsync(
            { id: user.id, payload: { status: newStatus } },
            {
              onSuccess: () => {
                toast.success("وضعیت کاربر به‌روزرسانی شد");
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

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          مدیریت کاربران
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          مشاهده، ویرایش و مدیریت نقش و وضعیت کاربران پلتفرم
        </p>
      </header>

      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="جستجوی نام، ایمیل یا موبایل…"
              className="h-10 ps-10"
              aria-label="جستجوی کاربران"
            />
          </div>
          <Button onClick={handleSearch} className="h-10 shrink-0">
            جستجو
          </Button>
          <Button
            variant="outline"
            className="h-10 shrink-0 sm:hidden"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal className="me-2 h-4 w-4" aria-hidden="true" />
            فیلتر
          </Button>
        </div>

        <div
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

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="mb-3 h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <AlertTriangle
              className="h-8 w-8 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "خطا در دریافت کاربران"}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
              تلاش دوباره
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">کاربری یافت نشد</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">
                        {user.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {user.phone || "—"}
                      </p>
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
                    <Badge
                      variant="outline"
                      className={cn("text-xs", ROLE_STYLES[user.role])}
                    >
                      {ROLE_LABEL[user.role]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", STATUS_STYLES[user.status])}
                    >
                      {STATUS_LABEL[user.status]}
                    </Badge>
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
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-start">نام</TableHead>
                    <TableHead className="text-start">ارتباط</TableHead>
                    <TableHead className="text-start">نقش</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-start">تأیید</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="transition-colors duration-150 hover:bg-muted/40"
                    >
                      <TableCell className="font-medium">{user.name}</TableCell>
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
                          >
                            {user.phone || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", ROLE_STYLES[user.role])}
                        >
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", STATUS_STYLES[user.status])}
                        >
                          {STATUS_LABEL[user.status]}
                        </Badge>
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
                {total.toLocaleString("fa-IR")} کاربر
                {isFetching && (
                  <span className="ms-1 inline-flex items-center gap-1">
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                    در حال به‌روزرسانی…
                  </span>
                )}
              </p>
              <div className="order-1 flex items-center justify-center gap-2 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 flex-1 sm:flex-none"
                >
                  <ChevronRight
                    className="me-1 h-4 w-4 sm:hidden"
                    aria-hidden="true"
                  />
                  <ChevronLeft
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
                >
                  بعدی
                  <ChevronLeft
                    className="ms-1 h-4 w-4 sm:hidden"
                    aria-hidden="true"
                  />
                  <ChevronRight
                    className="ms-1 hidden h-4 w-4 sm:inline"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---------- Edit user (sheet) ---------- */}
      <EditUserSheet
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
      />

      {/* ---------- Unified confirm dialog (no native confirm) ---------- */}
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
