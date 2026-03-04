import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingList, ShoppingItem } from '../types';
import { generateId } from '../utils/id';

interface ShoppingStore {
  lists: ShoppingList[];
  standaloneItems: ShoppingItem[];
  createList: (name: string, isTemplate?: boolean) => string;
  deleteList: (id: string) => void;
  updateListName: (id: string, name: string) => void;
  addItemToList: (listId: string, item: Omit<ShoppingItem, 'id'>) => void;
  updateItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  toggleItem: (listId: string, itemId: string) => void;
  removeItemFromList: (listId: string, itemId: string) => void;
  clearCheckedItems: (listId: string) => void;
  duplicateList: (id: string) => string;
  createListFromRecipe: (recipeName: string, items: Omit<ShoppingItem, 'id'>[]) => string;
  addStandaloneItem: (item: Omit<ShoppingItem, 'id'>) => void;
  toggleStandaloneItem: (itemId: string) => void;
  removeStandaloneItem: (itemId: string) => void;
  clearCheckedStandaloneItems: () => void;
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      standaloneItems: [],

      lists: [
        {
          id: 'template-1',
          name: 'Wocheneinkauf',
          isTemplate: true,
          createdAt: new Date().toISOString(),
          items: [
            { id: 't1', name: 'Milch', category: 'milch', quantity: 2, unit: 'L', checked: false },
            { id: 't2', name: 'Brot', category: 'backwaren', quantity: 1, unit: 'Stück', checked: false },
            { id: 't3', name: 'Äpfel', category: 'obst', quantity: 1, unit: 'kg', checked: false },
          ],
        },
      ],

      createList: (name, isTemplate = false) => {
        const id = generateId();
        set((state) => ({
          lists: [
            ...state.lists,
            { id, name, items: [], createdAt: new Date().toISOString(), isTemplate },
          ],
        }));
        return id;
      },

      deleteList: (id) =>
        set((state) => ({ lists: state.lists.filter((l) => l.id !== id) })),

      updateListName: (id, name) =>
        set((state) => ({
          lists: state.lists.map((l) => (l.id === id ? { ...l, name } : l)),
        })),

      addItemToList: (listId, item) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: [...l.items, { ...item, id: generateId() }],
                }
              : l
          ),
        })),

      updateItem: (listId, itemId, updates) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, ...updates } : i
                  ),
                }
              : l
          ),
        })),

      toggleItem: (listId, itemId) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, checked: !i.checked } : i
                  ),
                }
              : l
          ),
        })),

      removeItemFromList: (listId, itemId) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
              : l
          ),
        })),

      clearCheckedItems: (listId) =>
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((i) => !i.checked) }
              : l
          ),
        })),

      duplicateList: (id) => {
        const original = get().lists.find((l) => l.id === id);
        if (!original) return '';
        const newId = generateId();
        set((state) => ({
          lists: [
            ...state.lists,
            {
              ...original,
              id: newId,
              name: `${original.name} (Kopie)`,
              createdAt: new Date().toISOString(),
              isTemplate: false,
              items: original.items.map((i) => ({
                ...i,
                id: `${newId}-${i.id}`,
                checked: false,
              })),
            },
          ],
        }));
        return newId;
      },

      addStandaloneItem: (item) =>
        set((state) => ({
          standaloneItems: [...state.standaloneItems, { ...item, id: generateId() }],
        })),

      toggleStandaloneItem: (itemId) =>
        set((state) => ({
          standaloneItems: state.standaloneItems.map((i) =>
            i.id === itemId ? { ...i, checked: !i.checked } : i
          ),
        })),

      removeStandaloneItem: (itemId) =>
        set((state) => ({
          standaloneItems: state.standaloneItems.filter((i) => i.id !== itemId),
        })),

      clearCheckedStandaloneItems: () =>
        set((state) => ({
          standaloneItems: state.standaloneItems.filter((i) => !i.checked),
        })),

      createListFromRecipe: (recipeName, items) => {
        const id = generateId();
        set((state) => ({
          lists: [
            ...state.lists,
            {
              id,
              name: `Einkauf: ${recipeName}`,
              createdAt: new Date().toISOString(),
              isTemplate: false,
              items: items.map((item, index) => ({
                ...item,
                id: `${id}-${index}`,
                checked: false,
              })),
            },
          ],
        }));
        return id;
      },
    }),
    {
      name: 'shopwise-lists',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
