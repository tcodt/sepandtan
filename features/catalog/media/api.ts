import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  mapPagination,
  resolveMediaUrl,
} from "../utils";
import type {
  MediaItem,
  MediaListFilters,
  MediaListResponse,
  UploadMediaInput,
} from "../types";

function mapMedia(raw: unknown): MediaItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const path = asString(r.url);
  if (!id || !path) return null;

  return {
    id,
    path,
    url: resolveMediaUrl(path),
    alt: asString(r.alt),
    useCase: asString(r.useCase) ?? "PRODUCT",
    type: asString(r.type) ?? "IMAGE",
    sortOrder: asNumber(r.sortOrder) ?? 0,
    isMain: Boolean(r.isMain),
    productId: asString(r.productId),
    createdAt: asString(r.createdAt) ?? "",
  };
}

/** GET /media — Admin list (useCase required) */
export async function fetchMediaList(
  filters: MediaListFilters,
): Promise<MediaListResponse> {
  const { data } = await apiClient.get("/media", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      useCase: filters.useCase,
      order: filters.order,
      isMain:
        typeof filters.isMain === "boolean"
          ? String(filters.isMain)
          : undefined,
      productId: filters.productId,
      url: filters.url,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.media ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    media: list.map(mapMedia).filter((m): m is MediaItem => m !== null),
  };
}

function buildFormData(input: UploadMediaInput): FormData {
  const fd = new FormData();
  fd.append("file", input.file);
  if (input.alt) fd.append("alt", input.alt);
  if (input.useCase) fd.append("useCase", input.useCase);
  if (input.type) fd.append("type", input.type);
  if (input.productId) fd.append("productId", input.productId);
  if (typeof input.sortOrder === "number") {
    fd.append("sortOrder", String(input.sortOrder));
  }
  if (typeof input.isMain === "boolean") {
    fd.append("isMain", String(input.isMain));
  }
  if (input.reportsId) fd.append("reportsId", input.reportsId);
  if (input.ticketMessageId)
    fd.append("ticketMessageId", input.ticketMessageId);
  if (input.returnRequestId)
    fd.append("returnRequestId", input.returnRequestId);
  return fd;
}

function extractUploaded(raw: unknown): MediaItem | null {
  const mapped = mapMedia(raw);
  if (mapped) return mapped;

  // بعضی پاسخ‌ها فقط { url } یا { success, url }
  const r = (raw ?? {}) as Record<string, unknown>;
  const path =
    asString(r.url) ||
    asString(r.path) ||
    asString((r.data as Record<string, unknown> | undefined)?.url);
  if (!path) return null;
  return {
    id: asString(r.id) ?? crypto.randomUUID(),
    path,
    url: resolveMediaUrl(path),
    alt: asString(r.alt),
    useCase: asString(r.useCase) ?? "PRODUCT",
    type: asString(r.type) ?? "IMAGE",
    sortOrder: asNumber(r.sortOrder) ?? 0,
    isMain: Boolean(r.isMain),
    productId: asString(r.productId),
    createdAt: asString(r.createdAt) ?? new Date().toISOString(),
  };
}

/** POST /media — فقط تصویر */
export async function uploadImage(input: UploadMediaInput): Promise<MediaItem> {
  const { data } = await apiClient.post("/media", buildFormData(input), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const item = extractUploaded(data);
  if (!item) throw new Error("پاسخ آپلود نامعتبر است");
  return item;
}

/** POST /media/upload — تصویر / ویدیو / صدا / سند */
export async function uploadMedia(input: UploadMediaInput): Promise<MediaItem> {
  const { data } = await apiClient.post("/media/upload", buildFormData(input), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const item = extractUploaded(data);
  if (!item) throw new Error("پاسخ آپلود نامعتبر است");
  return item;
}

/**
 * DELETE /media/{url}
 * url باید همان path نسبی باشد (encodeURIComponent)
 */
export async function deleteMedia(pathOrUrl: string): Promise<void> {
  const path = pathOrUrl.replace(/^https?:\/\/[^/]+\//i, "").replace(/^\//, "");
  await apiClient.delete(`/media/${encodeURIComponent(path)}`);
}
