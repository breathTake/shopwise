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
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2 pb-2 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <Text className="text-[#34C759] font-medium" style={{ fontSize: 17 }}>‹ Zurück</Text>
          </TouchableOpacity>
          <Text className="text-[17px] font-semibold text-[#1C1C1E]">
            {isNew ? 'Neues Rezept' : 'Rezept bearbeiten'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}>
          {/* Name & Description */}
          <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">Name</Text>
          <View className="bg-white rounded-xl overflow-hidden mb-4">
            <TextInput
              className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
              placeholder="Rezeptname..."
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">Beschreibung</Text>
          <View className="bg-white rounded-xl overflow-hidden mb-4">
            <TextInput
              className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
              placeholder="Kurze Beschreibung..."
              placeholderTextColor="#8E8E93"
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ minHeight: 60, textAlignVertical: 'top' }}
            />
          </View>

          {/* Servings */}
          <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">Portionen</Text>
          <View className="bg-white rounded-xl overflow-hidden mb-4">
            <View className="flex-row items-center px-4 py-3.5">
              <Text className="text-[17px] text-[#1C1C1E] flex-1">Personenanzahl</Text>
              <TextInput
                className="text-[17px] text-[#1C1C1E] text-right"
                style={{ minWidth: 48 }}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Ingredients */}
          <View className="flex-row items-center justify-between mb-1 px-1">
            <Text className="text-xs text-[#8E8E93] uppercase tracking-wide">Zutaten</Text>
            <TouchableOpacity onPress={() => setAddModalVisible(true)}>
              <Text className="text-[15px] font-semibold text-[#34C759]">+ Hinzufügen</Text>
            </TouchableOpacity>
          </View>

          {ingredients.length === 0 ? (
            <View className="bg-white rounded-xl px-4 py-8 items-center mb-4">
              <Text className="text-3xl mb-2">🥕</Text>
              <Text className="text-[15px] text-[#8E8E93]">Noch keine Zutaten</Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl overflow-hidden mb-4">
              {ingredients.map((ing, idx) => (
                <View key={ing.id}>
                  <View className="flex-row items-center px-4 py-3.5">
                    <Text className="text-xl mr-3">{CATEGORY_ICONS[ing.category]}</Text>
                    <View className="flex-1">
                      <Text className="text-[17px] font-medium text-[#1C1C1E]">{ing.name}</Text>
                      <Text className="text-[13px] text-[#8E8E93]">{fmtQty(ing.quantity)} {ing.unit}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIngredients((prev) => prev.filter((i) => i.id !== ing.id))}
                      className="p-2"
                    >
                      <Text className="text-[#C7C7CC] text-base">✕</Text>
                    </TouchableOpacity>
                  </View>
                  {idx < ingredients.length - 1 && (
                    <View className="h-px bg-[#E5E5EA] ml-4" />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom action bar */}
        <View className="absolute bottom-8 left-4 right-4 flex-row gap-3">
          <TouchableOpacity
            onPress={openPortionModal}
            className="flex-1 bg-white py-3.5 rounded-2xl items-center border border-[#34C759]"
          >
            <Text className="text-[17px] font-semibold text-[#34C759]">Zur Liste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            className="flex-1 py-3.5 rounded-2xl items-center"
            style={{ backgroundColor: '#34C759' }}
          >
            <Text className="text-[17px] font-semibold text-white">Speichern</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Add Ingredient Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={resetIngredientModal} />
          <View className="bg-[#F2F2F7] rounded-t-3xl pt-3 pb-8 px-4">
            <View className="w-9 h-1 bg-[#E5E5EA] rounded-full self-center mb-4" />
            <Text className="text-[22px] font-bold text-[#1C1C1E] mb-4">Zutat hinzufügen</Text>

            <View className="bg-white rounded-xl overflow-hidden mb-3">
              <TextInput
                className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                placeholder="Zutat..."
                placeholderTextColor="#8E8E93"
                value={ingName}
                onChangeText={setIngName}
                autoFocus
              />
            </View>

            <View className="flex-row gap-2 mb-4">
              <View className="flex-1 bg-white rounded-xl overflow-hidden">
                <TextInput
                  className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                  placeholder="Menge"
                  placeholderTextColor="#8E8E93"
                  value={ingQuantity}
                  onChangeText={setIngQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1 bg-white rounded-xl overflow-hidden">
                <TextInput
                  className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                  placeholder="Einheit"
                  placeholderTextColor="#8E8E93"
                  value={ingUnit}
                  onChangeText={setIngUnit}
                />
              </View>
            </View>

            <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-2 px-1">Kategorie</Text>
            <View className="mb-6">
              <CategorySelector selected={ingCategory} onSelect={setIngCategory} />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={resetIngredientModal} className="flex-1 bg-white py-3.5 rounded-xl items-center">
                <Text className="text-[17px] font-semibold text-[#007AFF]">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddIngredient}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#34C759' }}
              >
                <Text className="text-[17px] font-semibold text-white">Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Portion Scale Modal */}
      <Modal visible={portionModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-[#F2F2F7] rounded-t-3xl pt-3 pb-8 px-4">
            <View className="w-9 h-1 bg-[#E5E5EA] rounded-full self-center mb-4" />
            <Text className="text-[22px] font-bold text-[#1C1C1E]" numberOfLines={1}>{name}</Text>
            <Text className="text-[15px] text-[#8E8E93] mt-0.5 mb-5">Originalrezept für {origServings} Personen</Text>

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

            {/* Scaled ingredients preview */}
            {ingredients.length > 0 && (
              <>
                <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">Zutaten (skaliert)</Text>
                <View className="bg-white rounded-xl overflow-hidden mb-4">
                  <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                    {ingredients.map((ing, idx) => {
                      const scaled = scaleQty(ing.quantity, origServings, targetServings);
                      const changed = scaled !== ing.quantity;
                      return (
                        <View key={ing.id} className={`flex-row items-center px-4 py-3 ${idx < ingredients.length - 1 ? 'border-b border-[#E5E5EA]' : ''}`}>
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
                onPress={() => setPortionModalVisible(false)}
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
