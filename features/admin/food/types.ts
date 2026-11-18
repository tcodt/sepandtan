export type FoodAdmin = {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FoodInput = {
  name: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  isActive?: boolean;
};

export type FoodFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
};

export type FoodResponse = {
  data: FoodAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
