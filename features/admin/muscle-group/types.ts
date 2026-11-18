export type MuscleGroupAdmin = {
  id: string;
  slug: string;
  title: string;
};

export type MuscleGroupInput = {
  slug: string;
  title: string;
};

export type MuscleGroupFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
};

export type MuscleGroupResponse = {
  data: MuscleGroupAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
