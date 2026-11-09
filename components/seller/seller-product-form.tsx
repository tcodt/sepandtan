"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
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
  slug: z
    .string()
    .min(2, "اسلاگ لازم است")
    .regex(/^[a-z0-9-]+$/, "فقط حروف لاتین، عدد و -"),
  description: z.string().min(5, "توضیح کوتاه لازم است"),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  brandId: z.string().optional(),
  rows: z.array(tableRowSchema).min(1, "حداقل یک ردیف مشخصات"),
});

type ProductFormValues = z.infer<typeof productSchema>;

/* -------------------------------------------------------------------------- */
/* Variant draft                                                              */
/* -------------------------------------------------------------------------- */

type VariantDraft = {
  key: string;
  name: string;
  price: string;
  quantity: string;
  colorId: string;
  attrs: Record<string, string>;
};

function newVariantDraft(): VariantDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    price: "",
    quantity: "",
    colorId: "",
    attrs: {},
  };
}

/* -------------------------------------------------------------------------- */
/* Spec rows                                                                  */
/* -------------------------------------------------------------------------- */

function SpecRowsSection({
  control,
  register,
  error,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  error?: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rows",
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>جدول مشخصات</Label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            حداقل یک ردیف وارد کنید.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ key: "", value: "" })}
        >
          <Plus className="me-1 h-3.5 w-3.5" />
          افزودن ردیف
        </Button>
      </div>

      <div className="space-y-2">
        {/* Header row — desktop only */}
        <div className="hidden grid-cols-[1fr_1fr_auto] gap-2 px-1 sm:grid">
          <span className="text-[11px] font-medium text-muted-foreground">
            عنوان مشخصه
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            مقدار
          </span>
          <span className="w-9" />
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_1fr_auto] sm:border-0 sm:p-0"
          >
            <Input
              placeholder="مثلاً جنس"
              {...register(`rows.${index}.key`)}
              aria-label={`عنوان مشخصه ردیف ${index + 1}`}
            />
            <Input
              placeholder="مثلاً پنبه"
              {...register(`rows.${index}.value`)}
              aria-label={`مقدار مشخصه ردیف ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
              disabled={fields.length <= 1}
              onClick={() => remove(index)}
              aria-label={`حذف ردیف ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Image uploader                                                             */
/* -------------------------------------------------------------------------- */

function ImageUploader({
  imagePaths,
  canEdit,
  uploading,
  onFiles,
  onRemove,
}: {
  imagePaths: string[];
  canEdit: boolean;
  uploading: boolean;
  onFiles: (files: FileList | null) => void;
  onRemove: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useMemo(
    () => imagePaths.map((p) => resolveMediaUrl(p)),
    [imagePaths],
  );

  return (
    <div className="space-y-3">
      <div>
        <Label>تصاویر محصول</Label>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          حداقل یک تصویر الزامی است. اولین تصویر به‌عنوان تصویر اصلی نمایش داده
          می‌شود.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {imagePaths.map((path, i) => {
          const url = previewUrls[i];
          return (
            <div
              key={path}
              className="group relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-contain p-1"
              />

              {i === 0 && (
                <Badge className="absolute inset-s-1 top-1 rounded-md bg-primary px-1.5 py-0 text-[9px] text-primary-foreground">
                  اصلی
                </Badge>
              )}

              {canEdit && (
                <button
                  type="button"
                  className="absolute inset-e-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-background/90 text-destructive opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                  onClick={() => onRemove(path)}
                  aria-label={`حذف تصویر ${i + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {canEdit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors",
              "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            aria-label="آپلود تصویر"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Upload className="h-5 w-5" aria-hidden="true" />
                <span className="text-[10px]">آپلود</span>
              </>
            )}
          </button>
        )}

        {imagePaths.length === 0 && !uploading && (
          <div className="flex items-center gap-2 self-center text-xs text-muted-foreground">
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            حداقل یک تصویر لازم است
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Variant editor                                                             */
/* -------------------------------------------------------------------------- */

function VariantCard({
  variant,
  index,
  canRemove,
  attributeDefs,
  colors,
  onChange,
  onRemove,
}: {
  variant: VariantDraft;
  index: number;
  canRemove: boolean;
  attributeDefs: { id: string; label: string; key: string }[];
  colors: { id: string; name: string; hexCode: string }[];
  onChange: (next: VariantDraft) => void;
  onRemove: () => void;
}) {
  const patch = (partial: Partial<VariantDraft>) =>
    onChange({ ...variant, ...partial });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
            {(index + 1).toLocaleString("fa-IR")}
          </span>
          <p className="text-sm font-medium text-foreground">واریانت</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={`حذف واریانت ${index + 1}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`variant-${variant.key}-name`}>نام واریانت</Label>
          <Input
            id={`variant-${variant.key}-name`}
            value={variant.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="مثلاً مشکی - XL"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`variant-${variant.key}-price`}>قیمت (تومان)</Label>
          <Input
            id={`variant-${variant.key}-price`}
            inputMode="numeric"
            dir="ltr"
            value={variant.price}
            onChange={(e) =>
              patch({ price: e.target.value.replace(/[^\d]/g, "") })
            }
            placeholder="350000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`variant-${variant.key}-qty`}>موجودی</Label>
          <Input
            id={`variant-${variant.key}-qty`}
            inputMode="numeric"
            dir="ltr"
            value={variant.quantity}
            onChange={(e) =>
              patch({ quantity: e.target.value.replace(/[^\d]/g, "") })
            }
            placeholder="1"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>رنگ (اختیاری)</Label>
          <Select
            value={variant.colorId || "none"}
            onValueChange={(val) =>
              patch({ colorId: val === "none" ? "" : val })
            }
          >
            <SelectTrigger dir="rtl">
              <SelectValue placeholder="بدون رنگ" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="none">بدون رنگ</SelectItem>
              {colors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: c.hexCode }}
                      aria-hidden="true"
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {attributeDefs.length > 0 && (
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
            {attributeDefs.map((def) => (
              <div key={def.id} className="space-y-1.5">
                <Label htmlFor={`variant-${variant.key}-${def.id}`}>
                  {def.label}
                </Label>
                <Input
                  id={`variant-${variant.key}-${def.id}`}
                  value={variant.attrs[def.id] ?? ""}
                  onChange={(e) =>
                    patch({
                      attrs: { ...variant.attrs, [def.id]: e.target.value },
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
  );
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

  const {
    formState: { errors },
    control,
    register,
  } = form;

  const title = useWatch({ control, name: "title" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const watchedBrandId = useWatch({ control, name: "brandId" });
  const watchedCategoryId = useWatch({ control, name: "categoryId" });

  const [slugTouched, setSlugTouched] = useState(false);
  useEffect(() => {
    if (slugTouched) return;
    if (!title?.trim()) return;
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
          image: imagePaths[0],
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

  return (
    <div className="space-y-6">
      {/* Step 1: product */}
      <section
        aria-labelledby="step-product"
        className="space-y-6 rounded-2xl border border-border bg-background p-4 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
              createdProductId
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-primary/10 text-primary",
            )}
          >
            {createdProductId ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              "۱"
            )}
          </span>
          <h2 id="step-product" className="text-sm font-semibold">
            اطلاعات محصول
          </h2>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmitProduct)}
          className="space-y-6"
          aria-busy={createProduct.isPending || uploading}
        >
          <fieldset disabled={!canEditProduct} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title" className="flex items-center gap-1">
                  عنوان محصول
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  aria-invalid={!!errors.title}
                  placeholder="مثلاً تی‌شرت پنبه‌ای آستین کوتاه"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="flex items-center gap-1">
                  اسلاگ (انگلیسی)
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id="slug"
                  dir="ltr"
                  className="font-mono text-sm"
                  {...register("slug")}
                  onChange={(e) => {
                    setSlugTouched(true);
                    form.setValue("slug", e.target.value, {
                      shouldValidate: true,
                    });
                  }}
                  aria-invalid={!!errors.slug}
                />
                {errors.slug ? (
                  <p className="text-xs text-destructive">
                    {errors.slug.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    فقط حروف کوچک لاتین، عدد و خط تیره.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  دسته‌بندی
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Select
                  value={watchedCategoryId || undefined}
                  onValueChange={(v) =>
                    form.setValue("categoryId", v, { shouldValidate: true })
                  }
                  disabled={catLoading}
                >
                  <SelectTrigger dir="rtl" aria-invalid={!!errors.categoryId}>
                    <SelectValue placeholder="انتخاب دسته…" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-xs text-destructive">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>برند (اختیاری)</Label>
                <Select
                  value={watchedBrandId || "none"}
                  onValueChange={(v) =>
                    form.setValue("brandId", v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="بدون برند" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="none">بدون برند</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="description"
                  className="flex items-center gap-1"
                >
                  توضیح کوتاه
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  {...register("description")}
                  aria-invalid={!!errors.description}
                  placeholder="خلاصه‌ای از ویژگی‌های اصلی محصول"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="content">توضیحات کامل (اختیاری)</Label>
                <Textarea
                  id="content"
                  rows={5}
                  {...register("content")}
                  placeholder="توضیح مفصل‌تر، شرایط استفاده، نگهداری و…"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="metaTitle">Meta Title (اختیاری)</Label>
                <Input id="metaTitle" {...register("metaTitle")} />
                <p className="text-[11px] text-muted-foreground">
                  برای بهبود نمایش در نتایج جستجو. در صورت خالی بودن، عنوان
                  محصول استفاده می‌شود.
                </p>
              </div>
            </div>

            <SpecRowsSection
              control={control}
              register={register}
              error={
                errors.rows?.message ?? errors.rows?.root?.message ?? undefined
              }
            />

            <ImageUploader
              imagePaths={imagePaths}
              canEdit={canEditProduct}
              uploading={uploading}
              onFiles={(f) => void handleFiles(f)}
              onRemove={removeImage}
            />
          </fieldset>

          {canEditProduct && (
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={createProduct.isPending || uploading}
            >
              {createProduct.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  در حال ثبت محصول…
                </>
              ) : (
                "ثبت محصول و ادامه"
              )}
            </Button>
          )}

          {createdProductId && (
            <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    محصول ثبت شد
                  </p>
                  {createdSlug && (
                    <p className="text-[11px] text-muted-foreground">
                      آدرس عمومی:{" "}
                      <span className="font-mono" dir="ltr">
                        /store/{createdSlug}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {createdSlug && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/store/${createdSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="me-1.5 h-3.5 w-3.5" />
                    مشاهده
                  </a>
                </Button>
              )}
            </div>
          )}
        </form>
      </section>

      {/* Step 2: variants */}
      {createdProductId && (
        <section
          aria-labelledby="step-variants"
          className="space-y-4 rounded-2xl border border-border bg-background p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                ۲
              </span>
              <div>
                <h2 id="step-variants" className="text-sm font-semibold">
                  واریانت‌ها
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  قیمت، موجودی، رنگ و ویژگی‌های دسته
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setVariants((prev) => [...prev, newVariantDraft()])
              }
            >
              <Plus className="me-1 h-3.5 w-3.5" />
              افزودن واریانت
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            {variants.map((v, index) => (
              <VariantCard
                key={v.key}
                variant={v}
                index={index}
                canRemove={variants.length > 1}
                attributeDefs={attributeDefs}
                colors={colors}
                onChange={(next) =>
                  setVariants((prev) =>
                    prev.map((x) => (x.key === next.key ? next : x)),
                  )
                }
                onRemove={() =>
                  setVariants((prev) => prev.filter((x) => x.key !== v.key))
                }
              />
            ))}
          </div>

          {/* Sticky action bar */}
          <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:mx-0 sm:rounded-xl sm:border">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/seller/products")}
                className="w-full sm:w-auto"
              >
                فعلاً محصول — رفتن به لیست
              </Button>
              <Button
                type="button"
                disabled={savingVariants || createVariant.isPending}
                onClick={() => void onSaveVariants()}
                className="w-full sm:w-auto"
              >
                {savingVariants ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    در حال ذخیره…
                  </>
                ) : (
                  "ذخیره واریانت‌ها و اتمام"
                )}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
