import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useShoppingStore } from '../../store/useShoppingStore';
import { Category, CATEGORY_ICONS, ShoppingItem } from '../../types';
import { CategorySelector } from '../../components/CategorySelector';
import { generateId } from '../../utils/id';

const DEFAULT_UNIT = 'Stück';

function scaleQty(qty: number, from: number, to: number): number {
  if (from === 0) return qty;
  return Math.round((qty * to / from) * 10) / 10;
}

function fmtQty(qty: number): string {
  return qty % 1 === 0 ? String(qty) : qty.toFixed(1).replace('.', ',');
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipes, addRecipe, updateRecipe } = useRecipeStore();
  const { createListFromRecipe } = useShoppingStore();

  const isNew = id === 'new';
  const recipe = isNew ? null : recipes.find((r) => r.id === id);

  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [servings, setServings] = useState(String(recipe?.servings ?? 2));
  const [ingredients, setIngredients] = useState<ShoppingItem[]>(recipe?.ingredients ?? []);

  // Add ingredient modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [ingName, setIngName] = useState('');
  const [ingQuantity, setIngQuantity] = useState('1');
  const [ingUnit, setIngUnit] = useState(DEFAULT_UNIT);
  const [ingCategory, setIngCategory] = useState<Category>('sonstiges');

  // Portion scale modal
  const [portionModalVisible, setPortionModalVisible] = useState(false);
  const [targetServings, setTargetServings] = useState(2);

  function resetIngredientModal() {
    setIngName('');
    setIngQuantity('1');
    setIngUnit(DEFAULT_UNIT);
    setIngCategory('sonstiges');
    setAddModalVisible(false);
  }

  function handleAddIngredient() {
    if (!ingName.trim()) return;
    setIngredients((prev) => [
      ...prev,
      {
        id: generateId(),
        name: ingName.trim(),
        category: ingCategory,
        quantity: parseFloat(ingQuantity) || 1,
        unit: ingUnit.trim() || DEFAULT_UNIT,
        checked: false,
      },
    ]);
    resetIngredientModal();
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Namen ein.');
      return;
    }
    if (isNew) {
      addRecipe({ name: name.trim(), description, servings: parseInt(servings) || 2, ingredients });
    } else if (id) {
      updateRecipe(id, { name: name.trim(), description, servings: parseInt(servings) || 2, ingredients });
    }
    router.back();
  }

  function openPortionModal() {
    if (!name.trim() || ingredients.length === 0) {
      Alert.alert('Fehler', 'Rezept muss einen Namen und Zutaten haben.');
      return;
    }
    setTargetServings(parseInt(servings) || 2);
    setPortionModalVisible(true);
  }

  function adjustServings(delta: number) {
    setTargetServings((prev) => Math.max(1, Math.min(20, prev + delta)));
  }

  function handleConfirmPortions() {
    const origServings = parseInt(servings) || 2;
    const scaledIngredients = ingredients.map((ing) => ({
      ...ing,
      quantity: scaleQty(ing.quantity, origServings, targetServings),
    }));
    const listId = createListFromRecipe(name, scaledIngredients);
    setPortionModalVisible(false);
    Alert.alert(
      'Liste erstellt',
      `Einkaufsliste für "${name}" (${targetServings} Personen) wurde erstellt.`,
      [
        { text: 'Zur Liste', onPress: () => router.push(`/list/${listId}`) },
        { text: 'OK' },
      ]
    );
  }

  const origServings = parseInt(servings) || 2;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <TextInput
            className="text-2xl font-bold text-gray-900 mb-1 bg-transparent"
            placeholder="Rezeptname..."
            value={name}
            onChangeText={setName}
            style={{ fontSize: 24 }}
          />
          <TextInput
            className="text-sm text-gray-400 mb-4 bg-transparent"
            placeholder="Kurze Beschreibung..."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View className="flex-row items-center gap-2 mb-6">
            <Text className="text-sm text-gray-600">👤 Portionen:</Text>
            <TextInput
              className="bg-white rounded-xl px-3 py-2 text-gray-900 text-sm w-16 text-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
            />
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900">Zutaten</Text>
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              className="bg-primary-100 px-3 py-1.5 rounded-xl"
            >
              <Text className="text-primary-700 font-semibold text-sm">+ Hinzufügen</Text>
            </TouchableOpacity>
          </View>

          {ingredients.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center mb-4"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
            >
              <Text className="text-3xl mb-2">🥕</Text>
              <Text className="text-sm text-gray-400">Noch keine Zutaten</Text>
            </View>
          ) : (
            ingredients.map((ing) => (
              <View
                key={ing.id}
                className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
              >
                <Text className="text-xl mr-3">{CATEGORY_ICONS[ing.category]}</Text>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">{ing.name}</Text>
                  <Text className="text-xs text-gray-400">{fmtQty(ing.quantity)} {ing.unit}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIngredients((prev) => prev.filter((i) => i.id !== ing.id))}
                  className="p-2"
                >
                  <Text className="text-gray-300">✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <View className="absolute bottom-8 left-4 right-4 flex-row gap-3">
          <TouchableOpacity
            onPress={openPortionModal}
            className="flex-1 bg-white border border-primary-300 py-3.5 rounded-2xl items-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
          >
            <Text className="text-primary-700 font-semibold">🛒 Zur Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            className="flex-1 bg-primary-600 py-3.5 rounded-2xl items-center"
            style={{ shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
          >
            <Text className="text-white font-semibold">💾 Speichern</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Add Ingredient Modal ── */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={resetIngredientModal} />
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Zutat hinzufügen</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-3"
              placeholder="Zutat..."
              value={ingName}
              onChangeText={setIngName}
              autoFocus
            />
            <View className="flex-row gap-2 mb-4">
              <TextInput
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base"
                placeholder="Menge"
                value={ingQuantity}
                onChangeText={setIngQuantity}
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base"
                placeholder="Einheit"
                value={ingUnit}
                onChangeText={setIngUnit}
              />
            </View>
            <View className="mb-6">
              <CategorySelector selected={ingCategory} onSelect={setIngCategory} />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={resetIngredientModal} className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center">
                <Text className="text-gray-700 font-semibold">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddIngredient} className="flex-1 bg-primary-600 py-3.5 rounded-xl items-center">
                <Text className="text-white font-semibold">Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Portion Scale Modal ── */}
      <Modal visible={portionModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-0.5" numberOfLines={1}>{name}</Text>
            <Text className="text-sm text-gray-400 mb-6">Originalrezept für {origServings} Personen</Text>

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

            {/* Scaled ingredients preview */}
            {ingredients.length > 0 && (
              <View className="mb-6">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Zutaten (skaliert)
                </Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {ingredients.map((ing) => {
                    const scaled = scaleQty(ing.quantity, origServings, targetServings);
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
                onPress={() => setPortionModalVisible(false)}
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
