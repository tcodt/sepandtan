export type EquipmentAdmin = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  description: string | null;
};

export type EquipmentInput = {
  slug: string;
  title: string;
  image?: string | null;
  description?: string | null;
};

export type EquipmentFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
};

export type EquipmentResponse = {
  data: EquipmentAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
