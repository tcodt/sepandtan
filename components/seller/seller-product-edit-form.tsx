"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Upload, Save, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { resolveMediaUrl, toSlug } from "@/features/catalog/utils";
import { useCategorySelector } from "@/features/catalog/categories/hooks";
import { useBrands } from "@/features/catalog/brands/hooks";
import { useColors } from "@/features/catalog/colors/hooks";
import { useUploadImage } from "@/features/catalog/media/hooks";
import { useAdminProducts, useUpdateProduct } from "@/features/products/hooks";
import type { UpdateProductInput } from "@/features/products/types";
import {
  useAttributeDefinitions,
  useCreateVariant,
  useDeleteVariant,
  useProductVariants,
  useUpdateVariant,
} from "@/features/variants/hooks";
import type {
  CreateVariantInput,
  ProductVariant,
  UpdateVariantInput,
} from "@/features/variants/types";

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const tableRowSchema = z.object({
  key: z.string().min(1, "عنوان مشخصه لازم است"),
  value: z.string().min(1, "مقدار لازم است"),
});

const productSchema = z.object({
  title: z.string().min(2, "عنوان حداقل ۲ کاراکتر"),
  slug: z.string().min(2, "اسلاگ لازم است"),
  description: z.string().min(5, "توضیح کوتاه لازم است"),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  brandId: z.string().optional(),
  rows: z.array(tableRowSchema).min(1, "حداقل یک ردیف مشخصات"),
});

type ProductFormValues = z.infer<typeof productSchema>;

type VariantDraft = {
  /** اگر از سرور آمده = id واقعی؛ اگر جدید = null */
  id: string | null;
  key: string;
  name: string;
  price: string;
  quantity: string;
  colorId: string;
  attrs: Record<string, string>;
  dirty: boolean;
};

function emptyVariantDraft(): VariantDraft {
  return {
    id: null,
    key: crypto.randomUUID(),
    name: "",
    price: "",
    quantity: "1",
    colorId: "",
    attrs: {},
    dirty: true,
  };
}

function variantFromServer(v: ProductVariant): VariantDraft {
  const attrs: Record<string, string> = {};
  for (const a of v.attributes) {
    if (a.attributeId) attrs[a.attributeId] = a.value;
  }
  return {
    id: v.id,
    key: v.id,
    name: v.name,
    price: v.price != null ? String(v.price) : "",
    quantity: String(v.quantity ?? 0),
    colorId: v.colorId ?? v.color?.id ?? "",
    attrs,
    dirty: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

type Props = { productId: string };

export function SellerProductEditForm({ productId }: Props) {
  const router = useRouter();

  const { data: categories = [], isLoading: catLoading } =
    useCategorySelector(false);
  const { data: brands = [] } = useBrands();
  const { data: colors = [] } = useColors();

  /**
   * جزئیات ادمین را از لیست ADMIN با search محدود می‌گیریم.
   * اگر بعداً endpoint detail ادمین داشتید، جایگزین کنید.
   */
  const {
    data: adminList,
    isLoading: productLoading,
    isError: productError,
    refetch: refetchProduct,
  } = useAdminProducts({
    page: 1,
    limit: 50,
    search: productId,
  });

  const product = useMemo(
    () => adminList?.products.find((p) => p.id === productId) ?? null,
    [adminList, productId],
  );

  const {
    data: serverVariants = [],
    isLoading: variantsLoading,
    refetch: refetchVariants,
  } = useProductVariants(productId, Boolean(productId));

  const uploadImage = useUploadImage();
  const updateProduct = useUpdateProduct();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant(productId);
  const deleteVariant = useDeleteVariant(productId);

  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [savingVariants, setSavingVariants] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      metaTitle: "",
      categoryId: "",
      brandId: "",
      rows: [{ key: "جنس", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rows",
  });

  const categoryId = form.watch("categoryId");

  const { data: attributeDefs = [] } = useAttributeDefinitions(
    { categoryId, noDetail: true },
    Boolean(categoryId),
  );

  /* -------------------- hydrate product form -------------------- */
  useEffect(() => {
    if (!product || hydrated) return;

    form.reset({
      title: product.title,
      slug: product.slug,
      description: product.description ?? "",
      content: "",
      metaTitle: "",
      categoryId: product.categoryId || product.category.id || "",
      brandId: "",
      rows: [{ key: "مشخصات", value: "—" }],
    });

    const paths = product.images.map((img) => img.path).filter(Boolean);
    setImagePaths(paths);
    setHydrated(true);
  }, [product, hydrated, form]);

  /* -------------------- hydrate variants -------------------- */
  useEffect(() => {
    if (variantsLoading) return;
    setVariants((prev) => {
      // اگر کاربر در حال ویرایش draft جدید است، سرور را روی idهای موجود merge کن
      const serverDrafts = serverVariants.map(variantFromServer);
      const localNew = prev.filter((v) => !v.id && v.dirty);
      return [...serverDrafts, ...localNew];
    });
  }, [serverVariants, variantsLoading]);

  /* -------------------- images -------------------- */
  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadImage.mutateAsync({
          file,
          useCase: "PRODUCT",
          productId,
          alt: form.getValues("title") || file.name,
          isMain: imagePaths.length + next.length === 0,
        });
        next.push(uploaded.path);
      }
      setImagePaths((prev) => [...prev, ...next]);
      toast.success("تصویر آپلود شد");
    } catch {
      // toast در hook
    } finally {
      setUploading(false);
    }
  }

  function removeImage(path: string) {
    setImagePaths((prev) => prev.filter((p) => p !== path));
  }

  /* -------------------- save product -------------------- */
  async function onSubmitProduct(values: ProductFormValues) {
    if (imagePaths.length === 0) {
      toast.error("حداقل یک تصویر لازم است");
      return;
    }

    const payload: UpdateProductInput = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      description: values.description.trim(),
      content: values.content?.trim() || undefined,
      metaTitle: values.metaTitle?.trim() || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId || undefined,
      images: imagePaths,
      productTable: {
        headers: ["مشخصات", "توضیحات"],
        rows: values.rows.map((r) => [r.key.trim(), r.value.trim()]),
      },
    };

    try {
      await updateProduct.mutateAsync({ id: productId, payload });
      await refetchProduct();
    } catch {
      // toast در hook
    }
  }

  /* -------------------- variants save -------------------- */
  function patchVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((prev) =>
      prev.map((v) => (v.key === key ? { ...v, ...patch, dirty: true } : v)),
    );
  }

  async function saveOneVariant(draft: VariantDraft) {
    const name = draft.name.trim();
    if (!name) {
      toast.error("نام واریانت خالی است");
      return;
    }
    const quantity = Number(draft.quantity);
    const price = draft.price.trim() ? Number(draft.price) : undefined;
    if (!Number.isFinite(quantity) || quantity < 0) {
      toast.error(`موجودی نامعتبر برای «${name}»`);
      return;
    }
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      toast.error(`قیمت نامعتبر برای «${name}»`);
      return;
    }

    const attributes = Object.entries(draft.attrs)
      .filter(([, value]) => value.trim())
      .map(([attributeId, value]) => ({
        attributeId,
        value: value.trim(),
      }));

    if (draft.id) {
      const payload: UpdateVariantInput = {
        name,
        quantity,
        price,
        colorId: draft.colorId || undefined,
        attributes: attributes.length ? attributes : undefined,
        image: imagePaths[0],
      };
      await updateVariant.mutateAsync({
        variantId: draft.id,
        payload,
      });
    } else {
      const payload: CreateVariantInput = {
        productId,
        name,
        quantity,
        price,
        colorId: draft.colorId || undefined,
        attributes: attributes.length ? attributes : undefined,
        image: imagePaths[0],
      };
      await createVariant.mutateAsync(payload);
    }
  }

  async function onSaveAllVariants() {
    const dirty = variants.filter((v) => v.dirty || !v.id);
    if (dirty.length === 0) {
      toast.message("تغییری در واریانت‌ها نیست");
      return;
    }
    setSavingVariants(true);
    try {
      for (const d of dirty) {
        await saveOneVariant(d);
      }
      toast.success("واریانت‌ها ذخیره شد");
      await refetchVariants();
    } catch {
      // toast در hook
    } finally {
      setSavingVariants(false);
    }
  }

  async function onDeleteVariant(draft: VariantDraft) {
    if (!draft.id) {
      setVariants((prev) => prev.filter((v) => v.key !== draft.key));
      return;
    }
    if (!confirm(`واریانت «${draft.name}» حذف شود؟`)) return;
    try {
      await deleteVariant.mutateAsync(draft.id);
      setVariants((prev) => prev.filter((v) => v.key !== draft.key));
    } catch {
      // toast در hook
    }
  }

  const imagePreviewUrls = useMemo(
    () => imagePaths.map((p) => resolveMediaUrl(p)),
    [imagePaths],
  );

  /* -------------------- loading / error -------------------- */
  if (productLoading && !product) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">محصول پیدا نشد یا دسترسی ندارید</p>
        <Button variant="outline" onClick={() => refetchProduct()}>
          تلاش مجدد
        </Button>
        <Button variant="ghost" onClick={() => router.push("/seller/products")}>
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{product.status}</Badge>
        {product.isFeatured && <Badge>ویژه</Badge>}
        <span>
          فروش: {product.saleCount.toLocaleString("fa-IR")} · بازدید:{" "}
          {product.viewCount.toLocaleString("fa-IR")}
        </span>
      </div>

      {/* -------------------- Product form -------------------- */}
      <form
        onSubmit={form.handleSubmit(onSubmitProduct)}
        className="space-y-6 rounded-2xl border border-border bg-background p-4 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <Package className="size-4 text-primary" />
          <h2 className="font-semibold text-sm">اطلاعات محصول</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">عنوان</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">اسلاگ</Label>
            <Input
              id="slug"
              dir="ltr"
              className="font-mono text-sm"
              {...form.register("slug")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() =>
                form.setValue("slug", toSlug(form.getValues("title")), {
                  shouldValidate: true,
                })
              }
            >
              ساخت از عنوان
            </Button>
          </div>

          <div className="space-y-2">
            <Label>دسته‌بندی</Label>
            <Select
              value={form.watch("categoryId") || undefined}
              onValueChange={(v) =>
                form.setValue("categoryId", v, { shouldValidate: true })
              }
              disabled={catLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب دسته" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>برند</Label>
            <Select
              value={form.watch("brandId") || "none"}
              onValueChange={(v) =>
                form.setValue("brandId", v === "none" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="بدون برند" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون برند</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">توضیح کوتاه</Label>
            <Textarea
              id="description"
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="content">توضیحات کامل</Label>
            <Textarea id="content" rows={4} {...form.register("content")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input id="metaTitle" {...form.register("metaTitle")} />
          </div>
        </div>

        {/* Spec rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>جدول مشخصات</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ key: "", value: "" })}
            >
              <Plus className="size-3.5 me-1" />
              ردیف
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                placeholder="عنوان"
                {...form.register(`rows.${index}.key`)}
              />
              <Input
                placeholder="مقدار"
                {...form.register(`rows.${index}.value`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Images */}
        <div className="space-y-3">
          <Label>تصاویر</Label>
          <div className="flex flex-wrap gap-3">
            {imagePreviewUrls.map((url, i) => (
              <div
                key={imagePaths[i]}
                className="relative size-24 rounded-xl border border-border overflow-hidden bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="size-full object-contain p-1"
                />
                <button
                  type="button"
                  className="absolute top-1 left-1 rounded-md bg-background/90 p-1 text-destructive"
                  onClick={() => removeImage(imagePaths[i])}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <label
              className={cn(
                "size-24 rounded-xl border border-dashed border-border",
                "flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer",
                "hover:border-primary/40 hover:text-primary",
              )}
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Upload className="size-5" />
                  <span className="text-[10px]">آپلود</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={updateProduct.isPending || uploading}
          className="w-full sm:w-auto"
        >
          {updateProduct.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin me-2" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="size-4 me-2" />
              ذخیره اطلاعات محصول
            </>
          )}
        </Button>
      </form>

      {/* -------------------- Variants -------------------- */}
      <section className="space-y-4 rounded-2xl border border-border bg-background p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-sm">واریانت‌ها</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              ایجاد، ویرایش و حذف تنوع‌های محصول
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVariants((prev) => [...prev, emptyVariantDraft()])
            }
          >
            <Plus className="size-3.5 me-1" />
            واریانت جدید
          </Button>
        </div>

        <Separator />

        {variantsLoading && variants.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : variants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            واریانتی ثبت نشده — یک مورد اضافه کنید
          </p>
        ) : (
          variants.map((v, index) => (
            <div
              key={v.key}
              className="space-y-3 rounded-xl border border-border p-3 sm:p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  واریانت {(index + 1).toLocaleString("fa-IR")}
                  {v.id ? (
                    <span className="ms-2 text-[10px] text-muted-foreground font-mono">
                      {v.id.slice(0, 8)}…
                    </span>
                  ) : (
                    <Badge variant="secondary" className="ms-2 text-[10px]">
                      جدید
                    </Badge>
                  )}
                  {v.dirty && (
                    <Badge variant="outline" className="ms-2 text-[10px]">
                      ذخیره‌نشده
                    </Badge>
                  )}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={deleteVariant.isPending}
                  onClick={() => void onDeleteVariant(v)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>نام</Label>
                  <Input
                    value={v.name}
                    onChange={(e) =>
                      patchVariant(v.key, { name: e.target.value })
                    }
                    placeholder="مثلاً مشکی - XL"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>قیمت (تومان)</Label>
                  <Input
                    inputMode="numeric"
                    value={v.price}
                    onChange={(e) =>
                      patchVariant(v.key, { price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>موجودی</Label>
                  <Input
                    inputMode="numeric"
                    value={v.quantity}
                    onChange={(e) =>
                      patchVariant(v.key, { quantity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>رنگ</Label>
                  <Select
                    value={v.colorId || "none"}
                    onValueChange={(val) =>
                      patchVariant(v.key, {
                        colorId: val === "none" ? "" : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="بدون رنگ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون رنگ</SelectItem>
                      {colors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="size-3 rounded-full border border-border"
                              style={{ backgroundColor: c.hexCode }}
                            />
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {attributeDefs.length > 0 && (
                  <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                    {attributeDefs.map((def) => (
                      <div key={def.id} className="space-y-1.5">
                        <Label>{def.label}</Label>
                        <Input
                          value={v.attrs[def.id] ?? ""}
                          onChange={(e) =>
                            patchVariant(v.key, {
                              attrs: {
                                ...v.attrs,
                                [def.id]: e.target.value,
                              },
                            })
                          }
                          placeholder={def.key}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={
              savingVariants ||
              createVariant.isPending ||
              updateVariant.isPending
            }
            onClick={() => void onSaveAllVariants()}
          >
            {savingVariants ? (
              <>
                <Loader2 className="size-4 animate-spin me-2" />
                ذخیره واریانت‌ها...
              </>
            ) : (
              <>
                <Save className="size-4 me-2" />
                ذخیره واریانت‌ها
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/seller/products")}
          >
            بازگشت به لیست
          </Button>
        </div>
      </section>
    </div>
  );
}
