export type ProvinceAdmin = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CityAdmin = {
  id: string;
  name: string;
  provinceId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProvinceInput = { name: string };
export type CityInput = { name: string; provinceId: string };
export type CityUpdateInput = { name: string };
