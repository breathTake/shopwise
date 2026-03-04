# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Expo dev server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

No lint or test scripts are configured. Use `npx expo lint` if needed.

## Architecture

**Shopwise** is a German-language React Native/Expo shopping list and recipe management app with AI-powered recipe suggestions.

### Routing

expo-router file-based routing. Entry point is `index.ts` → `expo-router/entry`. The root layout at [app/_layout.tsx](app/_layout.tsx) wraps a tab navigator group:

- `(tabs)/index.tsx` — Shopping lists (list & template management)
- `(tabs)/recipes.tsx` — Recipe browser
- `(tabs)/products.tsx` — Product catalog with search/filter
- `(tabs)/fridge.tsx` — AI fridge: add ingredients, call Claude API for recipe suggestions
- `list/[id].tsx` — Dynamic shopping list detail
- `recipe/[id].tsx` — Dynamic recipe create/edit

### State Management

Four Zustand stores in [store/](store/), all persisted via AsyncStorage:

| Store | Key | Purpose |
|---|---|---|
| `useShoppingStore` | `shopwise-lists` | Shopping lists and templates |
| `useRecipeStore` | `shopwise-recipes` | Recipes with ingredients |
| `useProductStore` | `shopwise-products` | Product catalog (10 German defaults) |
| `useFridgeStore` | `shopwise-fridge` | Virtual fridge ingredient tracking |

### Styling

NativeWind v4 (Tailwind for React Native). Custom theme colors in [tailwind.config.js](tailwind.config.js):
- `primary-*` — Green scale (primary-500: `#22c55e`, primary-600: `#16a34a`)
- `accent` — Blue (`#3b82f6`)

Global CSS imported in root layout via [global.css](global.css).

### Types

All shared types are in [types/index.ts](types/index.ts). Key types: `Category` (union of 9 German grocery categories), `Product`, `ShoppingItem`, `ShoppingList`, `Recipe`, `FridgeItem`. Category display labels and emoji icons are defined there as constants.

### AI Integration

[app/(tabs)/fridge.tsx](app/(tabs)/fridge.tsx) calls the Anthropic Claude API directly from the client using `@anthropic-ai/sdk`. Requires `EXPO_PUBLIC_ANTHROPIC_API_KEY` in the environment. Uses model `claude-haiku-4-5-20251001` to suggest recipes from fridge ingredients.

### Path Aliases

`@/*` maps to the project root (configured in [tsconfig.json](tsconfig.json)).

### ID Generation

[utils/id.ts](utils/id.ts) exports `generateId()` — returns `Date.now().toString()`. Use this for all new entity IDs.
