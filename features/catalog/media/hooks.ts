"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import { deleteMedia, fetchMediaList, uploadImage, uploadMedia } from "./api";
import type { MediaListFilters, UploadMediaInput } from "../types";

export const mediaKeys = {
  all: ["catalog", "media"] as const,
  list: (filters: MediaListFilters) =>
    [...mediaKeys.all, "list", filters] as const,
};

export function useMediaList(filters: MediaListFilters, enabled = true) {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: () => fetchMediaList(filters),
    enabled: enabled && Boolean(filters.useCase),
    placeholderData: (prev) => prev,
  });
}

export function useUploadImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadMediaInput) => uploadImage(input),
    onSuccess: async () => {
      toast.success("تصویر آپلود شد");
      await qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "آپلود تصویر ناموفق بود")),
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadMediaInput) => uploadMedia(input),
    onSuccess: async () => {
      toast.success("فایل آپلود شد");
      await qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "آپلود فایل ناموفق بود")),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pathOrUrl: string) => deleteMedia(pathOrUrl),
    onSuccess: async () => {
      toast.success("رسانه حذف شد");
      await qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف رسانه ناموفق بود")),
  });
}
