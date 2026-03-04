import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShoppingStore } from '../../store/useShoppingStore';
import { useProductStore } from '../../store/useProductStore';
import { Category, CATEGORY_LABELS, CATEGORY_ICONS, ShoppingItem } from '../../types';
import { FAB } from '../../components/FAB';
import { EmptyState } from '../../components/EmptyState';
import { CategorySelector } from '../../components/CategorySelector';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_UNIT = 'Stück';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lists, addItemToList, toggleItem, removeItemFromList, clearCheckedItems } = useShoppingStore();
  const { products } = useProductStore();

  const list = lists.find((l) => l.id === id);

  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState(DEFAULT_UNIT);
  const [itemCategory, setItemCategory] = useState<Category>('sonstiges');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const filteredProducts = useMemo(
    () => itemName.length > 0
      ? products.filter((p) => p.name.toLowerCase().includes(itemName.toLowerCase()))
      : [],
    [products, itemName],
  );

  const groupedItems = useMemo(() => {
    if (!list) return [];
    const groups: Record<string, ShoppingItem[]> = {};
    list.items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups) as [Category, ShoppingItem[]][];
  }, [list]);

  const { checkedCount, totalCount } = useMemo(() => ({
    checkedCount: list?.items.filter((i) => i.checked).length ?? 0,
    totalCount: list?.items.length ?? 0,
  }), [list]);

  function toggleCategory(category: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function resetModal() {
    setItemName('');
    setItemQuantity('1');
    setItemUnit(DEFAULT_UNIT);
    setItemCategory('sonstiges');
    setModalVisible(false);
  }

  function handleAddItem() {
    if (!itemName.trim() || !id) return;
    addItemToList(id, {
      name: itemName.trim(),
      category: itemCategory,
      quantity: parseFloat(itemQuantity) || 1,
      unit: itemUnit.trim() || DEFAULT_UNIT,
      checked: false,
    });
    resetModal();
  }

  function handleSelectProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItemName(product.name);
    setItemCategory(product.category);
    setItemUnit(product.defaultUnit ?? DEFAULT_UNIT);
    setItemQuantity(String(product.defaultQuantity ?? 1));
  }

  function handleClearChecked() {
    if (!id) return;
    Alert.alert('Erledigte entfernen', 'Alle erledigten Artikel löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => clearCheckedItems(id) },
    ]);
  }

  if (!list) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-400">Liste nicht gefunden</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ── Header ── */}
      <View className="px-5 pt-1 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <Text className="text-2xl text-gray-400">‹</Text>
          </TouchableOpacity>
          {checkedCount > 0 && (
            <TouchableOpacity
              onPress={handleClearChecked}
              className="bg-red-50 px-3 py-1.5 rounded-full"
            >
              <Text className="text-xs text-red-500 font-semibold">Erledigte löschen</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-4xl font-bold text-primary-600 mt-2" numberOfLines={2}>
          {list.name}
        </Text>
        <Text className="text-sm text-gray-400 mt-1">
          {totalCount === 0 ? 'Leer' : `${checkedCount} von ${totalCount} erledigt`}
        </Text>

        {totalCount > 0 && (
          <View className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-400 rounded-full"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </View>
        )}
      </View>

      {/* ── List ── */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {groupedItems.length === 0 ? (
          <View className="px-5">
            <EmptyState emoji="📝" title="Liste ist leer" subtitle="Tippe auf + um Artikel hinzuzufügen" />
          </View>
        ) : (
          groupedItems.map(([category, items]) => {
            const isCollapsed = collapsedCategories.has(category);
            const checkedInGroup = items.filter((i) => i.checked).length;

            return (
              <View key={category}>
                {/* Category header */}
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.6}
                  className="flex-row items-center justify-between px-5 py-3 bg-white"
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-gray-900">
                      {CATEGORY_LABELS[category]}
                    </Text>
                    {checkedInGroup > 0 && (
                      <View className="bg-primary-100 px-2 py-0.5 rounded-full">
                        <Text className="text-xs text-primary-600 font-semibold">
                          {checkedInGroup}/{items.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-400 text-base">{isCollapsed ? '›' : '⌄'}</Text>
                </TouchableOpacity>

                {/* Items */}
                {!isCollapsed && items.map((item, idx) => (
                  <View
                    key={item.id}
                    className={`flex-row items-center px-5 py-3.5 ${
                      idx < items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <TouchableOpacity
                      onPress={() => toggleItem(id, item.id)}
                      className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center flex-shrink-0 ${
                        item.checked ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                      }`}
                      activeOpacity={0.7}
                    >
                      {item.checked && (
                        <Text className="text-white font-bold" style={{ fontSize: 10 }}>✓</Text>
                      )}
                    </TouchableOpacity>

                    <Text className="text-xl mr-3 flex-shrink-0">{CATEGORY_ICONS[item.category]}</Text>

                    <View className="flex-1">
                      <Text
                        className={`text-base ${
                          item.checked ? 'text-gray-300 line-through' : 'text-gray-800'
                        }`}
                      >
                        {item.name}
                      </Text>
                      {(item.quantity !== 1 || item.unit !== DEFAULT_UNIT) && (
                        <Text className="text-xs text-gray-400 mt-0.5">
                          {item.quantity} {item.unit}
                          {item.note ? ` · ${item.note}` : ''}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => removeItemFromList(id, item.id)}
                      className="p-2 ml-1"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className="text-gray-200 text-base">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Category separator */}
                <View className="h-px bg-gray-100 mx-5 mt-1 mb-2" />
              </View>
            );
          })
        )}
      </ScrollView>

      <FAB onPress={() => setModalVisible(true)} />

      {/* ── Add Item Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={resetModal} />
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Artikel hinzufügen</Text>

            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-1"
              placeholder="🔍  Produkt suchen oder neu eingeben..."
              value={itemName}
              onChangeText={setItemName}
              autoFocus
            />

            {filteredProducts.length > 0 && (
              <ScrollView style={{ maxHeight: 120 }} className="mb-3">
                {filteredProducts.slice(0, 5).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleSelectProduct(p.id)}
                    className="flex-row items-center gap-2 py-2 px-1 border-b border-gray-100"
                  >
                    <Text>{CATEGORY_ICONS[p.category]}</Text>
                    <Text className="text-sm text-gray-700">{p.name}</Text>
                    <Text className="text-xs text-gray-400 ml-auto">{p.defaultUnit ?? ''}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View className="flex-row gap-2 mb-4">
              <TextInput
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base"
                placeholder="Menge"
                value={itemQuantity}
                onChangeText={setItemQuantity}
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base"
                placeholder="Einheit"
                value={itemUnit}
                onChangeText={setItemUnit}
              />
            </View>

            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategorie</Text>
            <View className="mb-6">
              <CategorySelector selected={itemCategory} onSelect={setItemCategory} />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={resetModal} className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center">
                <Text className="text-gray-700 font-semibold">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddItem} className="flex-1 bg-primary-600 py-3.5 rounded-xl items-center">
                <Text className="text-white font-semibold">Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
