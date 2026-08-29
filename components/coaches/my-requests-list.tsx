"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ChevronLeft,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { useUserStore } from "@/lib/store/user-store";
import {
  getMyCollaborationRequests,
  getCoachById,
  cancelCollaborationRequest,
  deleteCollaborationRequest,
} from "@/lib/api/coaches";
import type { CollaborationRequest, Coach } from "@/lib/types/coach";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_META: Record<
  CollaborationRequest["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: "در انتظار",
    icon: Clock,
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  accepted: {
    label: "پذیرفته‌شده",
    icon: CheckCircle2,
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  rejected: {
    label: "رد شده",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "لغو شده",
    icon: Ban,
    className: "bg-muted text-muted-foreground border-border",
  },
};

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "عضله‌سازی",
  general_fitness: "آمادگی عمومی",
  endurance: "استقامت / دویدن",
  nutrition: "تغذیه و رژیم",
  other: "سایر",
};

type RequestWithCoach = CollaborationRequest & {
  coach?: Coach | null;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function MyRequestsList() {
  const user = useUserStore((s) => s.user);
  const [items, setItems] = useState<RequestWithCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  const loadRequests = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const requests = await getMyCollaborationRequests(user!.id);

      const withCoaches = await Promise.all(
        requests.map(async (req) => {
          try {
            const coach = await getCoachById(req.coachId);
            return { ...req, coach };
          } catch {
            return { ...req, coach: null };
          }
        }),
      );

      setItems(withCoaches);
    } catch (e) {
      console.error(e);
      setError("نتونستیم درخواست‌هات رو بیاریم.");
      toast.error("خطا در بارگذاری درخواست‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, user?.id]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelCollaborationRequest(id);
      setItems((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "cancelled" as const } : r,
        ),
      );
      toast.success("درخواست لغو شد");
    } catch (e) {
      console.error(e);
      toast.error("لغو ناموفق بود. دوباره تلاش کن.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCollaborationRequest(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("درخواست حذف شد");
      setDeleteDialogOpen(false);
      setSelectedRequestId(null);
    } catch (e) {
      console.error(e);
      toast.error("حذف ناموفق بود. دوباره تلاش کن.");
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setSelectedRequestId(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2
          className="w-8 h-8 animate-spin text-primary"
          aria-label="در حال بارگذاری"
        />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Inbox className="w-6 h-6" />}
        title="یه مشکلی پیش اومد"
        description={error}
        actionLabel="تلاش مجدد"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="w-6 h-6" />}
        title="هنوز درخواستی نداری"
        description="از لیست مربیان، مربی مورد نظرت را پیدا کن و درخواست همکاری بده."
        actionLabel="مشاهده مربیان"
        actionHref="/coaches"
      />
    );
  }

  // Separate active and cancelled requests
  const activeRequests = items.filter((req) => req.status !== "cancelled");
  const cancelledRequests = items.filter((req) => req.status === "cancelled");

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {items.length.toLocaleString("fa-IR")} درخواست
          {cancelledRequests.length > 0 && (
            <span className="mr-1 text-muted-foreground/60">
              ({cancelledRequests.length} لغو شده)
            </span>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={loadRequests}
          disabled={loading}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          بروزرسانی
        </Button>
      </div>

      <div className="space-y-3">
        {/* Active Requests */}
        {activeRequests.map((req) => {
          const meta = STATUS_META[req.status] ?? STATUS_META.pending;
          const StatusIcon = meta.icon;
          const goalLabel = GOAL_LABELS[req.goal] ?? req.goal;

          return (
            <Card
              key={req.id}
              className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-border transition-colors"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {req.coach?.name ?? "مربی ناشناس"}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium gap-1 rounded-full px-2 py-0",
                          meta.className,
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      هدف: {goalLabel} · {formatDate(req.createdAt)}
                    </p>
                  </div>

                  {req.coach && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-8 gap-1 text-xs"
                    >
                      <Link href={`/coaches/${req.coachId}`}>
                        پروفایل
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>

                {req.message && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 bg-muted/40 rounded-xl px-3 py-2">
                    {req.message}
                  </p>
                )}

                {req.status === "pending" && req.id && (
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      disabled={cancellingId === req.id}
                      onClick={() => handleCancel(req.id!)}
                    >
                      {cancellingId === req.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
                          در حال لغو...
                        </>
                      ) : (
                        "لغو درخواست"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Cancelled Requests Section */}
        {cancelledRequests.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs font-medium text-muted-foreground/60">
                درخواست‌های لغو شده
              </span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {cancelledRequests.map((req) => {
              const meta = STATUS_META.cancelled;
              const StatusIcon = meta.icon;
              const goalLabel = GOAL_LABELS[req.goal] ?? req.goal;

              return (
                <Card
                  key={req.id}
                  className="border-border/30 bg-muted/30 backdrop-blur-sm overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-muted-foreground truncate">
                            {req.coach?.name ?? "مربی ناشناس"}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium gap-1 rounded-full px-2 py-0",
                              meta.className,
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground/60">
                          هدف: {goalLabel} · {formatDate(req.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {req.coach && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 gap-1 text-xs"
                          >
                            <Link href={`/coaches/${req.coachId}`}>
                              پروفایل
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        )}

                        <AlertDialog
                          open={
                            deleteDialogOpen && selectedRequestId === req.id
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setDeleteDialogOpen(false);
                              setSelectedRequestId(null);
                            }
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => openDeleteDialog(req.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف درخواست</AlertDialogTitle>
                              <AlertDialogDescription className="text-start">
                                آیا مطمئنی که می‌خواهی این درخواست را حذف کنی؟
                                این عمل قابل بازگشت نیست.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(req.id!)}
                                disabled={deletingId === req.id}
                              >
                                {deletingId === req.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    در حال حذف...
                                  </>
                                ) : (
                                  "حذف"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-xs sm:text-sm text-muted-foreground/60 leading-relaxed line-clamp-3 bg-muted/20 rounded-xl px-3 py-2">
                        {req.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
