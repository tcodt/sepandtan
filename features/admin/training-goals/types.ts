export type TrainingGoalAdmin = {
  id: string;
  title: string;
  logo: string | null;
  description: string | null;
  sortOrder: number;
};

export type TrainingGoalInput = {
  title: string;
  logo?: string | null;
  description?: string | null;
  sortOrder?: number;
};

export type TrainingGoalsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
};

export type TrainingGoalsResponse = {
  data: TrainingGoalAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
