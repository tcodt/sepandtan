"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Package, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAdminProducts, useDeleteProduct } from "@/features/products/hooks";
import type {
  AdminProductFilters,
  ProductStatus,
} from "@/features/products/types";

const statusFilters: Array<{
  id: string;
  label: string;
  status?: ProductStatus;
}> = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار", status: "PENDING" },
  { id: "approved", label: "تأییدشده", status: "APPROVED" },
  { id: "rejected", label: "ردشده", status: "REJECTED" },
];

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED")
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (s === "PENDING")
    return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  if (s === "REJECTED")
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground";
}

/**
 * نکته: GET /products/ADMIN برای نقش Store معمولاً فقط محصولات همان فروشنده را
 * برمی‌گرداند. sellerId را فقط وقتی از پروفایل/ادمین دارید ست کنید.
 */
export function SellerProductsScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState("all");

  const filters: AdminProductFilters = useMemo(() => {
    const chip = statusFilters.find((f) => f.id === statusId);
    return {
      page,
      limit: 12,
      search: search.trim() || undefined,
      status: chip?.status,
    };
  }, [page, search, statusId]);

  const { data, isLoading, isError, isFetching, refetch } =
    useAdminProducts(filters);
  const deleteProduct = useDeleteProduct();

  const products = data?.products ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="size-5 text-primary" />
            محصولات
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {data?.pagination.total != null
              ? `${data.pagination.total.toLocaleString("fa-IR")} مورد`
              : ""}
            {isFetching ? " · در حال به‌روزرسانی…" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/seller/products/new">محصول جدید</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/seller">بازگشت</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="جستجوی عنوان محصول..."
          className="h-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setStatusId(f.id);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              statusId === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">خطا در دریافت محصولات</p>
          <Button variant="outline" onClick={() => refetch()}>
            تلاش مجدد
          </Button>
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          محصولی یافت نشد
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const img = p.images[0]?.url;
            return (
              <div
                key={p.id}
                className="flex gap-3 rounded-2xl border border-border bg-background p-3 sm:p-4"
              >
                <div className="relative size-16 sm:size-20 rounded-xl bg-muted overflow-hidden shrink-0">
                  {img ? (
                    <Image
                      src={img}
                      alt={p.title}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold line-clamp-2">
                      {p.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        statusClass(p.status),
                      )}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.category.name}
                    {p.minPrice != null
                      ? ` · از ${p.minPrice.toLocaleString("fa-IR")} تومان`
                      : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    فروش: {p.saleCount.toLocaleString("fa-IR")} · بازدید:{" "}
                    {p.viewCount.toLocaleString("fa-IR")}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href={`/seller/products/${p.id}/edit`}>
                        <Pencil className="size-3.5 me-1" />
                        ویرایش
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive"
                      disabled={deleteProduct.isPending}
                      onClick={() => {
                        if (confirm("محصول حذف شود؟")) {
                          deleteProduct.mutate(p.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5 me-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          قبلی
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          صفحه {page.toLocaleString("fa-IR")}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.pagination.nextPage}
          onClick={() => setPage((p) => p + 1)}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}
