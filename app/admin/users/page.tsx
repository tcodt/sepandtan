"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  MoreHorizontal,
  Shield,
  UserX,
  Users,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle2,
  MinusCircle,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminUsers,
  useUpdateAdminUser,
  useDeleteAdminUser,
} from "@/features/admin/users/hooks/use-admin-users";
import type { BackendRole, BackendUserStatus } from "@/lib/types/api";
import type { AdminUsersFilters } from "@/features/admin/users/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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

/** Coach و Seller متقابلاً انحصاری‌اند */
function isForbiddenRoleSwitch(
  current: BackendRole,
  next: BackendRole,
): boolean {
  return (
    (current === "STORE" && next === "COACH") ||
    (current === "COACH" && next === "STORE")
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
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
          className="h-3.5 w-3.5 text-emerald-500"
          aria-hidden="true"
        />
      ) : (
        <MinusCircle
          className="h-3.5 w-3.5 text-muted-foreground/50"
          aria-hidden="true"
        />
      )}
      <span className="sr-only">{verified ? "تأیید شده" : "تأیید نشده"}</span>
    </div>
  );
}

function UserCard({
  user,
  onChangeRole,
  onChangeStatus,
  onDelete,
}: {
  user: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    role: BackendRole;
    status: BackendUserStatus;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  onChangeRole: (id: string, role: BackendRole) => void;
  onChangeStatus: (id: string, status: BackendUserStatus) => void;
  onDelete: (user: { id: string; name: string }) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors duration-150 hover:bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {user.name}
          </h3>
          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            <div className="truncate" title={user.email || "—"}>
              {user.email || "—"}
            </div>
            <div dir="ltr" className="truncate text-start">
              {user.phone || "—"}
            </div>
          </div>
        </div>

        <UserActions
          user={user}
          onChangeRole={onChangeRole}
          onChangeStatus={onChangeStatus}
          onDelete={onDelete}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("text-xs", ROLE_STYLES[user.role])}
        >
          {ROLE_LABEL[user.role] ?? user.role}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-xs", STATUS_STYLES[user.status])}
        >
          {STATUS_LABEL[user.status] ?? user.status}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3">
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
}

function UserActions({
  user,
  onChangeRole,
  onChangeStatus,
  onDelete,
}: {
  user: {
    id: string;
    name: string;
    role: BackendRole;
    status: BackendUserStatus;
  };
  onChangeRole: (id: string, role: BackendRole) => void;
  onChangeStatus: (id: string, status: BackendUserStatus) => void;
  onDelete: (user: { id: string; name: string }) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 data-[state=open]:bg-muted"
          aria-label={`گزینه‌های ${user.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          تغییر نقش
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onChangeRole(user.id, "USER")}>
          <Shield className="me-2 h-4 w-4" />
          کاربر
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={user.role === "STORE"}
          onClick={() => onChangeRole(user.id, "COACH")}
        >
          <Shield className="me-2 h-4 w-4" />
          مربی
          {user.role === "STORE" ? (
            <span className="ms-auto text-[10px] text-muted-foreground">
              اول کاربر
            </span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={user.role === "COACH"}
          onClick={() => onChangeRole(user.id, "STORE")}
        >
          <Shield className="me-2 h-4 w-4" />
          فروشنده
          {user.role === "COACH" ? (
            <span className="ms-auto text-[10px] text-muted-foreground">
              اول کاربر
            </span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChangeRole(user.id, "ADMIN")}>
          <Shield className="me-2 h-4 w-4" />
          ادمین
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          تغییر وضعیت
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onChangeStatus(user.id, "ACTIVE")}>
          فعال کردن
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChangeStatus(user.id, "SUSPENDED")}>
          معلق کردن
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete({ id: user.id, name: user.name })}
        >
          <UserX className="me-2 h-4 w-4" />
          حذف کاربر
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
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

function DesktopSkeleton() {
  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.2fr_2rem] gap-4 px-4 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div
          key={row}
          className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.2fr_2rem] items-center gap-4 px-4 py-4"
        >
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
        <Users className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {hasFilters
            ? "کاربری با این فیلترها یافت نشد"
            : "هنوز کاربری وجود ندارد"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? "برای دیدن نتایج بیشتر، فیلترها یا عبارت جستجو را تغییر دهید."
            : "به‌محض ثبت‌نام اولین کاربران، اینجا نمایش داده می‌شوند."}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset}>
          پاک کردن فیلترها
        </Button>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5">
        <AlertTriangle
          className="h-7 w-7 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          خطا در دریافت لیست کاربران
        </h3>
        <p className="mx-auto max-w-md wrap-break-word text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        تلاش دوباره
      </Button>
    </div>
  );
}

function FilterFields({
  role,
  status,
  onRoleChange,
  onStatusChange,
}: {
  role: BackendRole | "ALL";
  status: BackendUserStatus | "ALL";
  onRoleChange: (v: BackendRole | "ALL") => void;
  onStatusChange: (v: BackendUserStatus | "ALL") => void;
}) {
  return (
    <>
      <div className="w-full space-y-1.5 sm:w-40">
        <label className="text-xs font-medium text-muted-foreground">نقش</label>
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="h-10 w-full" aria-label="فیلتر نقش">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 w-full" aria-label="فیلتر وضعیت">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همه</SelectItem>
            <SelectItem value="ACTIVE">فعال</SelectItem>
            <SelectItem value="SUSPENDED">معلق</SelectItem>
            <SelectItem value="DELETED">حذف‌شده</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<BackendRole | "ALL">("ALL");
  const [status, setStatus] = useState<BackendUserStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  const handleChangeRole = useCallback(
    (userId: string, newRole: BackendRole) => {
      const target = users.find((u) => u.id === userId);
      if (!target) return;

      if (target.role === newRole) return;

      if (isForbiddenRoleSwitch(target.role, newRole)) {
        toast.error(
          "نقش مربی و فروشنده همزمان مجاز نیست. ابتدا نقش را به «کاربر» تغییر دهید، سپس نقش جدید را انتخاب کنید.",
        );
        return;
      }

      const label = ROLE_LABEL[newRole] ?? newRole;
      const ok = window.confirm(
        `نقش «${target.name}» از «${ROLE_LABEL[target.role]}» به «${label}» تغییر کند؟`,
      );
      if (!ok) return;

      updateMutation.mutate({ id: userId, payload: { role: newRole } });
    },
    [users, updateMutation],
  );

  const handleChangeStatus = useCallback(
    (userId: string, newStatus: BackendUserStatus) => {
      updateMutation.mutate({ id: userId, payload: { status: newStatus } });
    },
    [updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
    });
  }, [pendingDelete, deleteMutation]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          مدیریت کاربران
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          لیست، فیلتر و مدیریت نقش و وضعیت کاربران — مربی و فروشنده متقابل
          انحصاری‌اند
        </p>
      </header>

      <section aria-label="فیلترهای جستجوی کاربران" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="نام، ایمیل یا موبایل..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-10 ps-9 pe-9"
                aria-label="جستجوی کاربران"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 end-2 my-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="پاک کردن جستجو"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSearch}
              className="h-10 shrink-0 px-3 sm:px-4"
              aria-label="جستجو"
            >
              <Search className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">جستجو</span>
            </Button>

            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 px-3 lg:hidden"
                  aria-label="فیلترها"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">فیلترها</span>
                  {hasActiveFilters && (
                    <span className="ms-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="lg:hidden p-6">
                <SheetHeader>
                  <SheetTitle>فیلترها</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-4">
                  <FilterFields
                    role={role}
                    status={status}
                    onRoleChange={(v) => {
                      setRole(v);
                      setPage(1);
                    }}
                    onStatusChange={(v) => {
                      setStatus(v);
                      setPage(1);
                    }}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setRole("ALL");
                        setStatus("ALL");
                        setPage(1);
                      }}
                    >
                      بازنشانی
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      اعمال
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden gap-3 lg:flex">
          <FilterFields
            role={role}
            status={status}
            onRoleChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 self-end text-muted-foreground"
              onClick={handleReset}
            >
              <X className="me-1.5 h-3.5 w-3.5" />
              پاک کردن
            </Button>
          )}
        </div>
      </section>

      <section
        aria-label="لیست کاربران"
        aria-busy={isLoading || isFetching}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        {isLoading ? (
          <>
            <div className="md:hidden">
              <MobileSkeleton />
            </div>
            <div className="hidden md:block">
              <DesktopSkeleton />
            </div>
          </>
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : "خطای ناشناخته"}
            onRetry={() => refetch()}
          />
        ) : users.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onReset={handleReset} />
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onChangeRole={handleChangeRole}
                  onChangeStatus={handleChangeStatus}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-start">نام</TableHead>
                    <TableHead className="text-start">ایمیل / موبایل</TableHead>
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
                      <TableCell className="text-sm text-muted-foreground">
                        <div
                          className="max-w-[16rem] truncate"
                          title={user.email || "—"}
                        >
                          {user.email || "—"}
                        </div>
                        <div dir="ltr" className="max-w-48 truncate text-xs">
                          {user.phone || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ROLE_STYLES[user.role]}
                        >
                          {ROLE_LABEL[user.role] ?? user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_STYLES[user.status]}
                        >
                          {STATUS_LABEL[user.status] ?? user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
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
                          onChangeRole={handleChangeRole}
                          onChangeStatus={handleChangeStatus}
                          onDelete={setPendingDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {totalPages > 1 && !isLoading && !isError && (
          <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
              صفحه {page} از {totalPages}
              <span className="mx-1">·</span>
              {total.toLocaleString("fa-IR")} کاربر
              {isFetching && (
                <span className="ms-1 inline-flex items-center gap-1">
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                  در حال به‌روزرسانی...
                </span>
              )}
            </p>

            <div className="order-1 flex gap-2 sm:order-2">
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
        )}
      </section>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف کاربر «{pendingDelete?.name}» مطمئن هستید؟ این عملیات
              قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <UserX className="me-2 h-4 w-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
