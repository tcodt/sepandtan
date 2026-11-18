export type ExerciseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type ExerciseAdmin = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  notic: string[];
  stepAction: string[];
  level: ExerciseLevel;
  isActive: boolean;
  durationMin: number | null;
  caloriesMin: number | null;
  caloriesMax: number | null;
  gif: string | null;
  video: string | null;
  coverImg: string | null;
  categoryId: string | null;
  muscleIds: string[];
  equipmentIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ExerciseInput = {
  title: string;
  slug: string;
  isActive?: boolean;
  description?: string | null;
  notic?: string[];
  stepAction?: string[];
  level?: ExerciseLevel;
  durationMin?: number | null;
  caloriesMin?: number | null;
  caloriesMax?: number | null;
  gif?: string | null;
  video?: string | null;
  coverImg?: string | null;
  categoryId?: string | null;
  muscleIds?: string[];
  equipmentIds?: string[];
};

export type ExerciseFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
  level?: ExerciseLevel | "ALL";
  isActive?: boolean | "ALL";
};

export type ExerciseResponse = {
  data: ExerciseAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
