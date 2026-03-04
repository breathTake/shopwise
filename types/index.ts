export type Category =
  | 'obst'
  | 'gemuese'
  | 'milch'
  | 'fleisch'
  | 'getraenke'
  | 'tiefkuehl'
  | 'backwaren'
  | 'gewuerze'
  | 'sonstiges';

export const CATEGORIES: Category[] = [
  'obst', 'gemuese', 'milch', 'fleisch', 'getraenke',
  'tiefkuehl', 'backwaren', 'gewuerze', 'sonstiges',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  obst: 'Obst & Nüsse',
  gemuese: 'Gemüse',
  milch: 'Milch & Käse',
  fleisch: 'Fleisch & Fisch',
  getraenke: 'Getränke',
  tiefkuehl: 'Tiefkühl',
  backwaren: 'Backwaren',
  gewuerze: 'Gewürze & Öle',
  sonstiges: 'Sonstiges',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  obst: '🍎',
  gemuese: '🥦',
  milch: '🧀',
  fleisch: '🥩',
  getraenke: '🥤',
  tiefkuehl: '🧊',
  backwaren: '🍞',
  gewuerze: '🧂',
  sonstiges: '🛒',
};

export interface Product {
  id: string;
  name: string;
  category: Category;
  defaultUnit?: string;
  defaultQuantity?: number;
}

export interface ShoppingItem {
  id: string;
  productId?: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  checked: boolean;
  note?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  isTemplate: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  ingredients: ShoppingItem[];
  createdAt: string;
}

export interface FridgeItem {
  id: string;
  name: string;
  category?: Category;
}
