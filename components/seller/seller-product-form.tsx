"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Upload, ImageIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { toSlug, resolveMediaUrl } from "@/features/catalog/utils";
import { useCategorySelector } from "@/features/catalog/categories/hooks";
import { useBrands } from "@/features/catalog/brands/hooks";
import { useColors } from "@/features/catalog/colors/hooks";
import { useUploadImage } from "@/features/catalog/media/hooks";
import { useCreateProduct } from "@/features/products/hooks";
import {
  useAttributeDefinitions,
  useCreateVariant,
} from "@/features/variants/hooks";
import type { CreateProductInput } from "@/features/products/types";
import type { CreateVariantInput } from "@/features/variants/types";

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
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
  key: string;
  name: string;
  price: string;
  quantity: string;
  colorId: string;
  /** attributeId -> value */
  attrs: Record<string, string>;
};

function newVariantDraft(): VariantDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    price: "",
    quantity: "1",
    colorId: "",
    attrs: {},
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function SellerProductForm() {
  const router = useRouter();

  const { data: categories = [], isLoading: catLoading } =
    useCategorySelector(false);
  const { data: brands = [] } = useBrands();
  const { data: colors = [] } = useColors();

  const uploadImage = useUploadImage();
  const createProduct = useCreateProduct();
  const createVariant = useCreateVariant();

  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  /** بعد از ساخت محصول */
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>([newVariantDraft()]);
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

  const title = form.watch("title");
  const categoryId = form.watch("categoryId");

  // اسلاگ خودکار تا وقتی کاربر دستی عوض نکرده
  const [slugTouched, setSlugTouched] = useState(false);
  useEffect(() => {
    if (slugTouched) return;
    if (!title.trim()) return;
    form.setValue("slug", toSlug(title), { shouldValidate: true });
  }, [title, slugTouched, form]);

  const { data: attributeDefs = [] } = useAttributeDefinitions(
    { categoryId, noDetail: true },
    Boolean(categoryId),
  );

  const canEditProduct = !createdProductId;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadImage.mutateAsync({
          file,
          useCase: "PRODUCT",
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

  async function onSubmitProduct(values: ProductFormValues) {
    if (imagePaths.length === 0) {
      toast.error("حداقل یک تصویر آپلود کنید");
      return;
    }

    const payload: CreateProductInput = {
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
      const result = await createProduct.mutateAsync(payload);
      // بک‌اند ممکن است entity یا فقط success برگرداند
      const id =
        result &&
        typeof result === "object" &&
        "id" in result &&
        typeof (result as { id: unknown }).id === "string"
          ? (result as { id: string }).id
          : null;

      setCreatedSlug(values.slug.trim());

      if (id) {
        setCreatedProductId(id);
        toast.success("محصول ثبت شد — واریانت‌ها را اضافه کنید");
      } else {
        // اگر id در پاسخ نبود، کاربر را به لیست بفرست
        toast.success("محصول ثبت شد");
        router.push("/seller/products");
      }
    } catch {
      // toast در hook
    }
  }

  async function onSaveVariants() {
    if (!createdProductId) return;

    const cleaned = variants
      .map((v) => ({
        ...v,
        name: v.name.trim(),
        price: v.price.trim(),
        quantity: v.quantity.trim(),
      }))
      .filter((v) => v.name.length > 0);

    if (cleaned.length === 0) {
      toast.error("حداقل یک واریانت با نام وارد کنید");
      return;
    }

    setSavingVariants(true);
    try {
      for (const v of cleaned) {
        const quantity = Number(v.quantity);
        const price = v.price ? Number(v.price) : undefined;
        if (!Number.isFinite(quantity) || quantity < 0) {
          toast.error(`موجودی نامعتبر برای «${v.name}»`);
          setSavingVariants(false);
          return;
        }
        if (price != null && (!Number.isFinite(price) || price < 0)) {
          toast.error(`قیمت نامعتبر برای «${v.name}»`);
          setSavingVariants(false);
          return;
        }

        const attributes = Object.entries(v.attrs)
          .filter(([, value]) => value.trim())
          .map(([attributeId, value]) => ({
            attributeId,
            value: value.trim(),
          }));

        const payload: CreateVariantInput = {
          productId: createdProductId,
          name: v.name,
          quantity,
          price,
          colorId: v.colorId || undefined,
          attributes: attributes.length ? attributes : undefined,
          image: imagePaths[0], // تصویر اصلی محصول به‌صورت پیش‌فرض
        };

        await createVariant.mutateAsync(payload);
      }

      toast.success("واریانت‌ها ذخیره شد");
      router.push("/seller/products");
    } catch {
      // toast در hook
    } finally {
      setSavingVariants(false);
    }
  }

  const imagePreviewUrls = useMemo(
    () => imagePaths.map((p) => resolveMediaUrl(p)),
    [imagePaths],
  );

  return (
    <div className="space-y-8">
      {/* -------------------- Product form -------------------- */}
      <form
        onSubmit={form.handleSubmit(onSubmitProduct)}
        className="space-y-6 rounded-2xl border border-border bg-background p-4 sm:p-6"
      >
        <fieldset disabled={!canEditProduct} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">عنوان محصول</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">اسلاگ (انگلیسی)</Label>
              <Input
                id="slug"
                dir="ltr"
                className="font-mono text-sm"
                {...form.register("slug")}
                onChange={(e) => {
                  setSlugTouched(true);
                  form.setValue("slug", e.target.value, {
                    shouldValidate: true,
                  });
                }}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
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
              {form.formState.errors.categoryId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>برند (اختیاری)</Label>
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
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="content">توضیحات کامل (اختیاری)</Label>
              <Textarea id="content" rows={4} {...form.register("content")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="metaTitle">Meta Title (اختیاری)</Label>
              <Input id="metaTitle" {...form.register("metaTitle")} />
            </div>
          </div>

          {/* Spec table */}
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
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="مثلاً جنس"
                    {...form.register(`rows.${index}.key`)}
                  />
                  <Input
                    placeholder="مثلاً پنبه"
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
            {form.formState.errors.rows && (
              <p className="text-xs text-destructive">
                {form.formState.errors.rows.message ||
                  form.formState.errors.rows.root?.message}
              </p>
            )}
          </div>

          {/* Images */}
          <div className="space-y-3">
            <Label>تصاویر محصول</Label>
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
                  {canEditProduct && (
                    <button
                      type="button"
                      className="absolute top-1 left-1 rounded-md bg-background/90 p-1 text-destructive"
                      onClick={() => removeImage(imagePaths[i])}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {canEditProduct && (
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
              )}

              {imagePaths.length === 0 && !uploading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="size-4" />
                  حداقل یک تصویر لازم است
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {canEditProduct && (
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={createProduct.isPending || uploading}
          >
            {createProduct.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin me-2" />
                در حال ثبت محصول...
              </>
            ) : (
              "ثبت محصول و ادامه واریانت"
            )}
          </Button>
        )}

        {createdProductId && (
          <p className="text-sm text-primary">
            محصول ثبت شد
            {createdSlug ? ` · /store/${createdSlug}` : ""} · حالا واریانت‌ها را
            ذخیره کنید
          </p>
        )}
      </form>

      {/* -------------------- Variants -------------------- */}
      {createdProductId && (
        <section className="space-y-4 rounded-2xl border border-border bg-background p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">واریانت‌ها</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                قیمت، موجودی، رنگ و ویژگی‌های دسته
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setVariants((prev) => [...prev, newVariantDraft()])
              }
            >
              <Plus className="size-3.5 me-1" />
              واریانت
            </Button>
          </div>

          <Separator />

          {variants.map((v, index) => (
            <div
              key={v.key}
              className="space-y-3 rounded-xl border border-border p-3 sm:p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  واریانت {(index + 1).toLocaleString("fa-IR")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={variants.length <= 1}
                  onClick={() =>
                    setVariants((prev) => prev.filter((x) => x.key !== v.key))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>نام واریانت</Label>
                  <Input
                    value={v.name}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((x) =>
                          x.key === v.key ? { ...x, name: e.target.value } : x,
                        ),
                      )
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
                      setVariants((prev) =>
                        prev.map((x) =>
                          x.key === v.key ? { ...x, price: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="350000"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>موجودی</Label>
                  <Input
                    inputMode="numeric"
                    value={v.quantity}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((x) =>
                          x.key === v.key
                            ? { ...x, quantity: e.target.value }
                            : x,
                        ),
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>رنگ (اختیاری)</Label>
                  <Select
                    value={v.colorId || "none"}
                    onValueChange={(val) =>
                      setVariants((prev) =>
                        prev.map((x) =>
                          x.key === v.key
                            ? { ...x, colorId: val === "none" ? "" : val }
                            : x,
                        ),
                      )
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
                            setVariants((prev) =>
                              prev.map((x) =>
                                x.key === v.key
                                  ? {
                                      ...x,
                                      attrs: {
                                        ...x.attrs,
                                        [def.id]: e.target.value,
                                      },
                                    }
                                  : x,
                              ),
                            )
                          }
                          placeholder={def.key}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={savingVariants || createVariant.isPending}
              onClick={() => void onSaveVariants()}
            >
              {savingVariants ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  ذخیره واریانت‌ها...
                </>
              ) : (
                "ذخیره واریانت‌ها و اتمام"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/seller/products")}
            >
              فعلاً فقط محصول — برو به لیست
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
