/* eslint-disable @typescript-eslint/no-explicit-any */
// Base product interface with common properties
interface BaseProduct {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  comments: Comment[];
  likes: number;
}

// Comment interface
export interface Comment {
  id: number;
  user: string;
  text: string;
  date: string; // YYYY-MM-DD format
  likes: number;
}

// Apparel specific interface
interface ApparelProduct extends BaseProduct {
  category: "apparel";
  material: string;
  sizes: string[];
  color: string;
  weight: string;
  care: string;
  features: string[];
  brand: string;
  madeIn: string;
  season: string;
  gender: string;
  warranty: string;
}

// Nutrition specific interface
interface NutritionProduct extends BaseProduct {
  category: "nutrition";
  servingSize: string;
  servingsPerPackage: number;
  protein?: string;
  calories: number;
  ingredients: string[];
  flavor: string;
  expiryMonths: number;
  usage: string;
  storage: string;
  brand: string;
  country: string;
  suitable: string;
  // Optional fields that may appear in different nutrition products
  aminoProfile?: string[];
  allergen?: string;
  creatine?: string;
  bcaa?: string;
  vitamins?: string[];
  minerals?: string[];
  sideEffects?: string;
  features?: string[];
  iron?: string;
  chlorophyll?: string;
  loadingPhase?: string;
  solubility?: string;
  mixability?: string;
  caffeine?: string;
  vegan?: string;
  keto?: string;
}

// Equipment specific interface
interface EquipmentProduct extends BaseProduct {
  category: "equipment";
  weight: string;
  material: string;
  diameter?: string;
  length?: string;
  grip?: string;
  warranty: string;
  features: string[];
  shape?: string;
  application?: string;
  package: string;
  brand: string;
  country: string;
}

// Union type for all product types
export type Product = ApparelProduct | NutritionProduct | EquipmentProduct;

// Type guard functions
export function isApparelProduct(product: Product): product is ApparelProduct {
  return product.category === "apparel";
}

export function isNutritionProduct(
  product: Product,
): product is NutritionProduct {
  return product.category === "nutrition";
}

export function isEquipmentProduct(
  product: Product,
): product is EquipmentProduct {
  return product.category === "equipment";
}

// Helper type to extract specific category types
export type ApparelProducts = Extract<Product, { category: "apparel" }>;
export type NutritionProducts = Extract<Product, { category: "nutrition" }>;
export type EquipmentProducts = Extract<Product, { category: "equipment" }>;

// Type for the entire items array
export type ItemsArray = Product[];

// You can also create a more flexible type if you prefer
export type FlexibleProduct = {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  comments: Comment[];
  likes: number;
  [key: string]: any; // Allow any additional properties
};
