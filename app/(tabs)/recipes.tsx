import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useShoppingStore } from '../../store/useShoppingStore';
import { FAB } from '../../components/FAB';
import { EmptyState } from '../../components/EmptyState';
import { Recipe, CATEGORY_ICONS } from '../../types';

function scaleQty(qty: number, from: number, to: number): number {
  if (from === 0) return qty;
  return Math.round((qty * to / from) * 10) / 10;
}

function fmtQty(qty: number): string {
  return qty % 1 === 0 ? String(qty) : qty.toFixed(1).replace('.', ',');
}

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, deleteRecipe } = useRecipeStore();
  const { createListFromRecipe } = useShoppingStore();

  const [portionModal, setPortionModal] = useState<{
    visible: boolean;
    recipe: Recipe | null;
    targetServings: number;
  }>({ visible: false, recipe: null, targetServings: 2 });

  function openPortionModal(recipe: Recipe) {
    setPortionModal({ visible: true, recipe, targetServings: recipe.servings });
  }

  function closePortionModal() {
    setPortionModal({ visible: false, recipe: null, targetServings: 2 });
  }

  function adjustServings(delta: number) {
    setPortionModal((p) => ({
      ...p,
      targetServings: Math.max(1, Math.min(20, p.targetServings + delta)),
    }));
  }

  function handleConfirmPortions() {
    const { recipe, targetServings } = portionModal;
    if (!recipe) return;
    const scaledIngredients = recipe.ingredients.map((ing) => ({
      ...ing,
      quantity: scaleQty(ing.quantity, recipe.servings, targetServings),
    }));
    const listId = createListFromRecipe(recipe.name, scaledIngredients);
    closePortionModal();
    Alert.alert(
      'Liste erstellt',
      `"Einkauf: ${recipe.name}" für ${targetServings} Personen wurde erstellt.`,
      [
        { text: 'Zur Liste', onPress: () => router.push(`/list/${listId}`) },
        { text: 'OK' },
      ]
    );
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Rezept löschen', `"${name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteRecipe(id) },
    ]);
  }

  const { recipe: portionRecipe, targetServings } = portionModal;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-6 pb-2">
        <Text className="text-3xl font-bold text-gray-900">Rezepte</Text>
        <Text className="text-base text-gray-500 mt-1">Gespeicherte Rezepte</Text>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/recipe/${item.id}`)}
            className="bg-white rounded-2xl p-4 mb-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
                {item.description && (
                  <Text className="text-sm text-gray-400 mt-0.5" numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
                <View className="flex-row items-center gap-3 mt-2">
                  <Text className="text-xs text-gray-400">👤 {item.servings} Personen</Text>
                  <Text className="text-xs text-gray-400">🥕 {item.ingredients.length} Zutaten</Text>
                </View>
              </View>
              <View className="flex-row gap-2 ml-2">
                <TouchableOpacity
                  onPress={() => openPortionModal(item)}
                  className="bg-primary-50 p-2 rounded-xl"
                >
                  <Text className="text-sm">🛒</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.name)}
                  className="bg-red-50 p-2 rounded-xl"
                >
                  <Text className="text-sm">🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState emoji="📖" title="Keine Rezepte" subtitle="Füge dein erstes Rezept hinzu" />
        }
      />

      <FAB onPress={() => router.push('/recipe/new')} />

      {/* ── Portion Scale Modal ── */}
      <Modal visible={portionModal.visible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              {portionRecipe?.name ?? ''}
            </Text>
            <Text className="text-sm text-gray-400 mt-0.5 mb-6">
              Originalrezept für {portionRecipe?.servings ?? 0} Personen
            </Text>

            {/* Stepper */}
            <View className="items-center mb-6">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Portionen anpassen
              </Text>
              <View className="flex-row items-center gap-8">
                <TouchableOpacity
                  onPress={() => adjustServings(-1)}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl text-gray-600 font-light" style={{ lineHeight: 28 }}>−</Text>
                </TouchableOpacity>

                <View className="items-center" style={{ minWidth: 80 }}>
                  <Text className="text-5xl font-bold text-gray-900 text-center">{targetServings}</Text>
                  <Text className="text-xs text-gray-400 mt-1">Personen</Text>
                </View>

                <TouchableOpacity
                  onPress={() => adjustServings(1)}
                  className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl text-primary-600 font-light" style={{ lineHeight: 28 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scaled preview */}
            {portionRecipe && portionRecipe.ingredients.length > 0 && (
              <View className="mb-6">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Zutaten (skaliert)
                </Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {portionRecipe.ingredients.map((ing) => {
                    const scaled = scaleQty(ing.quantity, portionRecipe.servings, targetServings);
                    const changed = scaled !== ing.quantity;
                    return (
                      <View key={ing.id} className="flex-row items-center py-2.5 border-b border-gray-50">
                        <Text className="text-base mr-2">{CATEGORY_ICONS[ing.category]}</Text>
                        <Text className="flex-1 text-sm text-gray-800">{ing.name}</Text>
                        <View className="items-end">
                          <Text className={`text-sm font-semibold ${changed ? 'text-primary-600' : 'text-gray-500'}`}>
                            {fmtQty(scaled)} {ing.unit}
                          </Text>
                          {changed && (
                            <Text className="text-xs text-gray-400">
                              statt {fmtQty(ing.quantity)} {ing.unit}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={closePortionModal}
                className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmPortions}
                className="flex-1 bg-primary-600 py-3.5 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">🛒 Zur Einkaufsliste</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
