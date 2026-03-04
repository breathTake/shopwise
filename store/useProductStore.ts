import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Category } from '../types';
import { generateId } from '../utils/id';

interface ProductStore {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductsByCategory: (category: Category) => Product[];
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [
        { id: '1', name: 'Milch', category: 'milch', defaultUnit: 'L', defaultQuantity: 1 },
        { id: '2', name: 'Butter', category: 'milch', defaultUnit: 'g', defaultQuantity: 250 },
        { id: '3', name: 'Eier', category: 'milch', defaultUnit: 'Stück', defaultQuantity: 6 },
        { id: '4', name: 'Brot', category: 'backwaren', defaultUnit: 'Stück', defaultQuantity: 1 },
        { id: '5', name: 'Äpfel', category: 'obst', defaultUnit: 'kg', defaultQuantity: 1 },
        { id: '6', name: 'Tomaten', category: 'gemuese', defaultUnit: 'Stück', defaultQuantity: 4 },
        { id: '7', name: 'Hähnchenbrust', category: 'fleisch', defaultUnit: 'g', defaultQuantity: 500 },
        { id: '8', name: 'Nudeln', category: 'sonstiges', defaultUnit: 'g', defaultQuantity: 500 },
        { id: '9', name: 'Salz', category: 'gewuerze', defaultUnit: 'Pkg.', defaultQuantity: 1 },
        { id: '10', name: 'Olivenöl', category: 'gewuerze', defaultUnit: 'Flasche', defaultQuantity: 1 },
      ],

      addProduct: (product) =>
        set((state) => ({
          products: [
            ...state.products,
            { ...product, id: generateId() },
          ],
        })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      getProductsByCategory: (category) =>
        get().products.filter((p) => p.category === category),
    }),
    {
      name: 'shopwise-products',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
