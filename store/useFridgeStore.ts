import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FridgeItem, Category } from '../types';
import { generateId } from '../utils/id';

interface FridgeStore {
  items: FridgeItem[];
  addItem: (name: string, category?: Category) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export const useFridgeStore = create<FridgeStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (name, category) =>
        set((state) => ({
          items: [
            ...state.items,
            { id: generateId(), name, category },
          ],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'shopwise-fridge',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
