export type Province = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type City = {
  id: string;
  name: string;
  provinceId: string;
  createdAt?: string;
  updatedAt?: string;
};
