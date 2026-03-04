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
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="font-bold text-[#1C1C1E]" style={{ fontSize: 34 }}>Rezepte</Text>
        <Text className="text-[#8E8E93]" style={{ fontSize: 15 }}>Gespeicherte Rezepte</Text>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
        renderItem={({ item, index }) => (
          <View>
            {index === 0 && (
              <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">
                Alle Rezepte
              </Text>
            )}
            <TouchableOpacity
              onPress={() => router.push(`/recipe/${item.id}`)}
              className="bg-white rounded-xl overflow-hidden mb-px"
              activeOpacity={0.6}
            >
              <View className="px-4 py-3.5 flex-row items-center">
                <View className="flex-1 mr-3">
                  <Text className="text-[17px] font-medium text-[#1C1C1E]" numberOfLines={1}>{item.name}</Text>
                  {item.description ? (
                    <Text className="text-[13px] text-[#8E8E93] mt-0.5" numberOfLines={1}>{item.description}</Text>
                  ) : (
                    <Text className="text-[13px] text-[#8E8E93] mt-0.5">
                      {item.servings} Personen · {item.ingredients.length} Zutaten
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => openPortionModal(item)}
                  className="bg-[#F0FEF4] w-9 h-9 rounded-full items-center justify-center mr-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 16 }}>🛒</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.name)}
                  className="bg-[#FFF1F0] w-9 h-9 rounded-full items-center justify-center"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 14 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            {index < recipes.length - 1 && (
              <View className="h-px bg-[#E5E5EA] ml-4" />
            )}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState emoji="📖" title="Keine Rezepte" subtitle="Füge dein erstes Rezept hinzu" />
        }
      />

      <FAB onPress={() => router.push('/recipe/new')} />

      {/* Portion Scale Modal */}
      <Modal visible={portionModal.visible} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-[#F2F2F7] rounded-t-3xl pt-3 pb-8 px-4">
            <View className="w-9 h-1 bg-[#E5E5EA] rounded-full self-center mb-4" />

            <Text className="text-[22px] font-bold text-[#1C1C1E]" numberOfLines={1}>
              {portionRecipe?.name ?? ''}
            </Text>
            <Text className="text-[15px] text-[#8E8E93] mt-0.5 mb-5">
              Originalrezept für {portionRecipe?.servings ?? 0} Personen
            </Text>

            {/* Stepper */}
            <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-3 px-1">Portionen anpassen</Text>
            <View className="bg-white rounded-xl px-4 py-4 mb-4 items-center">
              <View className="flex-row items-center gap-8">
                <TouchableOpacity
                  onPress={() => adjustServings(-1)}
                  className="w-12 h-12 bg-[#E5E5EA] rounded-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-[#1C1C1E] font-light" style={{ fontSize: 28, lineHeight: 32 }}>−</Text>
                </TouchableOpacity>

                <View className="items-center" style={{ minWidth: 80 }}>
                  <Text className="text-[#1C1C1E] font-bold text-center" style={{ fontSize: 48 }}>{targetServings}</Text>
                  <Text className="text-[13px] text-[#8E8E93] mt-1">Personen</Text>
                </View>

                <TouchableOpacity
                  onPress={() => adjustServings(1)}
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#34C759' }}
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-light" style={{ fontSize: 28, lineHeight: 32 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scaled preview */}
            {portionRecipe && portionRecipe.ingredients.length > 0 && (
              <>
                <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">Zutaten (skaliert)</Text>
                <View className="bg-white rounded-xl overflow-hidden mb-4">
                  <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                    {portionRecipe.ingredients.map((ing, idx) => {
                      const scaled = scaleQty(ing.quantity, portionRecipe.servings, targetServings);
                      const changed = scaled !== ing.quantity;
                      return (
                        <View key={ing.id} className={`flex-row items-center px-4 py-3 ${idx < portionRecipe.ingredients.length - 1 ? 'border-b border-[#E5E5EA]' : ''}`}>
                          <Text className="text-base mr-2">{CATEGORY_ICONS[ing.category]}</Text>
                          <Text className="flex-1 text-[15px] text-[#1C1C1E]">{ing.name}</Text>
                          <View className="items-end">
                            <Text className={`text-[15px] font-semibold ${changed ? 'text-[#34C759]' : 'text-[#8E8E93]'}`}>
                              {fmtQty(scaled)} {ing.unit}
                            </Text>
                            {changed && (
                              <Text className="text-[12px] text-[#8E8E93]">
                                statt {fmtQty(ing.quantity)} {ing.unit}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={closePortionModal}
                className="flex-1 bg-white py-3.5 rounded-xl items-center"
              >
                <Text className="text-[17px] font-semibold text-[#007AFF]">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmPortions}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#34C759' }}
              >
                <Text className="text-[17px] font-semibold text-white">Zur Einkaufsliste</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
