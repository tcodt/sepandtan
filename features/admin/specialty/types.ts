export type SpecialtyAdmin = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
};

export type SpecialtyInput = {
  slug: string;
  title: string;
};

export type SpecialtyFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
};

export type SpecialtyResponse = {
  data: SpecialtyAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
