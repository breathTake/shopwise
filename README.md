![Version](https://img.shields.io/badge/Version-1.0.0-22c55e?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-3b82f6?style=flat-square)
![Built with](https://img.shields.io/badge/Built%20with-Expo%20%2B%20React%20Native-000000?style=flat-square)
![AI](https://img.shields.io/badge/AI-Claude%20Haiku-orange?style=flat-square)

---

## What is Shopwise?

Shopwise is a shopping and recipe app that simplifies your daily life. Create and manage shopping lists, save favorite recipes with automatic quantity adjustment — and let AI suggest recipes based on what's currently in your fridge.

---

## Features

### 🗂️ Shopping Lists

**List View (Accordion)**
All your shopping lists at a glance. Tap on a list to see and check off the items inline — without opening the list. A progress bar shows how much is already done.

**Overall View**
All items from all your lists, sorted by product category. Each item shows a small badge with the name of its associated list. Perfect for grocery store visits: walk through once, collect everything.

**Templates**
Save frequently used lists as templates (e.g., "Weekly groceries"). With a single tap, you can create a copy and get started right away.

**Other Items**
Items that aren't assigned to a specific list end up in a separate "Other Items" section — ideal for spontaneous individual items.

---

### ➕ Adding Items

The green `+` button opens a speed dial menu:

- **New List** — Create a new shopping list (optionally as a template)
- **Add Item** — Add an item directly:
  - Product search with autocomplete from your product catalog
  - Target list selectable (or "no list" for Other Items)
  - Quantity, unit, and category adjustable

---

### 📖 Recipes

**Create & Manage Recipes**
Create your own recipes with name, description, serving count, and an arbitrarily long ingredient list (with emoji categories).

**Scale Servings**
When adding to a shopping list, you can adjust the serving count. All ingredient quantities are automatically recalculated proportionally:

| Original (4 servings) | → 3 servings |
|---|---|
| 500 g pasta | **375 g** |
| 4 eggs | **3** |
| 2 tbsp olive oil | **1.5 tbsp** |
| 3 tsp salt | **2.3 tsp** |

Changed quantities are highlighted in green. A tap on "Add to shopping list" directly creates a new list with the scaled ingredients.

---

### 📦 Product Catalog

A personal product catalog with a default unit per product. Used as an autocomplete source for all item inputs. 10 German default products are pre-installed.

Products can be filtered by category:
🍎 Fruits & Nuts · 🥦 Vegetables · 🧀 Dairy & Cheese · 🥩 Meat & Fish · 🥤 Beverages · 🧊 Frozen · 🍞 Baked Goods · 🧂 Spices & Oils · 🛒 Miscellaneous

---

### 🧊 AI Fridge

The smartest part of the app: Enter what's currently in your fridge — and let **Claude AI** (Anthropic) suggest matching recipes.

- Enter ingredients from your fridge
- AI analyzes the available ingredients
- Matching recipe ideas are suggested
- Process directly as a new recipe or shopping list

> Requires an Anthropic API key (available for free for test usage).

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) + [React Native](https://reactnative.dev) |
| Language | TypeScript |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based) |
| Styling | [NativeWind v4](https://www.nativewind.dev) (Tailwind CSS) |
| State | [Zustand](https://zustand-demo.pmnd.rs) + AsyncStorage persistence |
| AI | [Anthropic Claude](https://anthropic.com) (`claude-haiku-4-5`) |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your smartphone (for quick testing)

### Installation

```bash
# Clone repository
git clone https://github.com/your-name/shopwise.git
cd shopwise

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
```

> You can get the API key for free at [console.anthropic.com](https://console.anthropic.com).
> Without a key, the app works fully — only the AI Fridge is unavailable.

### Start the App

```bash
# Start Expo dev server
npm start

# Or directly on a platform
npm run android
npm run ios
npm run web
```

Scan the QR code with the Expo Go app — done.

---

## Project Structure

```
shopwise/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Shopping lists (List + Overall view)
│   │   ├── recipes.tsx      # Recipe overview
│   │   ├── products.tsx     # Product catalog
│   │   └── fridge.tsx       # AI Fridge
│   ├── list/[id].tsx        # Shopping list detail
│   └── recipe/[id].tsx      # Create/edit recipe
├── components/
│   ├── CategorySelector.tsx # Category selection component
│   ├── FAB.tsx              # Floating Action Button
│   └── EmptyState.tsx       # Empty state component
├── store/
│   ├── useShoppingStore.ts  # Lists & standalone items
│   ├── useRecipeStore.ts    # Recipes
│   ├── useProductStore.ts   # Product catalog
│   └── useFridgeStore.ts    # Fridge ingredients
├── types/index.ts           # All TypeScript types & constants
└── utils/id.ts              # ID generation
```

---


## License

MIT — free to use, modify, and distribute.

---

<p align="center">
  Made with ☕ and 🤖
</p>
