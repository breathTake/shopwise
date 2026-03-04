import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../types';
import { generateId } from '../utils/id';

interface RecipeStore {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => string;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: [
        {
          id: 'r1',
          name: 'Pasta Bolognese',
          description: 'Klassische Pasta mit Hackfleisch-Soße',
          servings: 4,
          createdAt: new Date().toISOString(),
          ingredients: [
            { id: 'r1i1', name: 'Hackfleisch', category: 'fleisch', quantity: 500, unit: 'g', checked: false },
            { id: 'r1i2', name: 'Nudeln', category: 'sonstiges', quantity: 400, unit: 'g', checked: false },
            { id: 'r1i3', name: 'Tomaten', category: 'gemuese', quantity: 4, unit: 'Stück', checked: false },
            { id: 'r1i4', name: 'Zwiebeln', category: 'gemuese', quantity: 2, unit: 'Stück', checked: false },
            { id: 'r1i5', name: 'Olivenöl', category: 'gewuerze', quantity: 2, unit: 'EL', checked: false },
          ],
        },
        {
          id: 'r2',
          name: 'Pfannkuchen',
          description: 'Einfache Pfannkuchen zum Frühstück',
          servings: 2,
          createdAt: new Date().toISOString(),
          ingredients: [
            { id: 'r2i1', name: 'Mehl', category: 'backwaren', quantity: 200, unit: 'g', checked: false },
            { id: 'r2i2', name: 'Milch', category: 'milch', quantity: 300, unit: 'ml', checked: false },
            { id: 'r2i3', name: 'Eier', category: 'milch', quantity: 2, unit: 'Stück', checked: false },
            { id: 'r2i4', name: 'Butter', category: 'milch', quantity: 20, unit: 'g', checked: false },
          ],
        },
      ],

      addRecipe: (recipe) => {
        const id = generateId();
        set((state) => ({
          recipes: [
            ...state.recipes,
            { ...recipe, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      updateRecipe: (id, updates) =>
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'shopwise-recipes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
