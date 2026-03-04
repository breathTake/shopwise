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
      <SafeAreaView className="flex-1 bg-[#F2F2F7] items-center justify-center">
        <Text className="text-[#8E8E93]">Liste nicht gefunden</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <Text className="text-[#34C759] font-medium" style={{ fontSize: 17 }}>‹ Zurück</Text>
          </TouchableOpacity>
          {checkedCount > 0 && (
            <TouchableOpacity onPress={handleClearChecked}>
              <Text className="text-[15px] text-[#FF3B30] font-medium">Erledigte löschen</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text className="font-bold text-[#34C759]" style={{ fontSize: 34 }} numberOfLines={2}>
          {list.name}
        </Text>
        <Text className="text-[15px] text-[#8E8E93] mt-0.5">
          {totalCount === 0 ? 'Leer' : `${checkedCount} von ${totalCount} erledigt`}
        </Text>

        {totalCount > 0 && (
          <View className="mt-3 h-1 bg-[#E5E5EA] rounded-full overflow-hidden">
            <View
              className="h-full bg-[#34C759] rounded-full"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </View>
        )}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {groupedItems.length === 0 ? (
          <EmptyState emoji="📝" title="Liste ist leer" subtitle="Tippe auf + um Artikel hinzuzufügen" />
        ) : (
          groupedItems.map(([category, items]) => {
            const isCollapsed = collapsedCategories.has(category);
            const checkedInGroup = items.filter((i) => i.checked).length;

            return (
              <View key={category} className="mb-3">
                {/* Category header */}
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.6}
                  className="flex-row items-center justify-between mb-1 px-1"
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-[#8E8E93] uppercase tracking-wide font-semibold">
                      {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                    </Text>
                    {checkedInGroup > 0 && (
                      <View className="bg-[#E5F7EB] px-2 py-0.5 rounded-full">
                        <Text className="text-[11px] text-[#34C759] font-semibold">
                          {checkedInGroup}/{items.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[#8E8E93] text-sm">{isCollapsed ? '›' : '⌄'}</Text>
                </TouchableOpacity>

                {/* Items card */}
                {!isCollapsed && (
                  <View className="bg-white rounded-xl overflow-hidden">
                    {items.map((item, idx) => (
                      <View key={item.id}>
                        <View className="flex-row items-center px-4 py-3.5">
                          <TouchableOpacity
                            onPress={() => toggleItem(id, item.id)}
                            className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0 ${
                              item.checked ? 'bg-[#34C759] border-[#34C759]' : 'border-[#E5E5EA]'
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
                              className={`text-[17px] ${
                                item.checked ? 'text-[#8E8E93] line-through' : 'text-[#1C1C1E]'
                              }`}
                            >
                              {item.name}
                            </Text>
                            {(item.quantity !== 1 || item.unit !== DEFAULT_UNIT) && (
                              <Text className="text-[13px] text-[#8E8E93] mt-0.5">
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
                            <Text className="text-[#C7C7CC] text-base">✕</Text>
                          </TouchableOpacity>
                        </View>
                        {idx < items.length - 1 && (
                          <View className="h-px bg-[#E5E5EA] ml-4" />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <FAB onPress={() => setModalVisible(true)} />

      {/* Add Item Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={resetModal} />
          <View className="bg-[#F2F2F7] rounded-t-3xl pt-3 pb-8 px-4">
            <View className="w-9 h-1 bg-[#E5E5EA] rounded-full self-center mb-4" />
            <Text className="text-[22px] font-bold text-[#1C1C1E] mb-4">Artikel hinzufügen</Text>

            <View className="bg-white rounded-xl overflow-hidden mb-1">
              <TextInput
                className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                placeholder="Produkt suchen oder neu eingeben..."
                placeholderTextColor="#8E8E93"
                value={itemName}
                onChangeText={setItemName}
                autoFocus
              />
            </View>

            {filteredProducts.length > 0 && (
              <View className="bg-white rounded-xl overflow-hidden mb-3">
                <ScrollView style={{ maxHeight: 120 }}>
                  {filteredProducts.slice(0, 5).map((p, idx) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => handleSelectProduct(p.id)}
                      className={`flex-row items-center gap-2 py-3 px-4 ${idx > 0 ? 'border-t border-[#E5E5EA]' : ''}`}
                    >
                      <Text>{CATEGORY_ICONS[p.category]}</Text>
                      <Text className="text-[15px] text-[#1C1C1E] flex-1">{p.name}</Text>
                      <Text className="text-[13px] text-[#8E8E93] ml-auto">{p.defaultUnit ?? ''}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="flex-row gap-2 mb-4">
              <View className="flex-1 bg-white rounded-xl overflow-hidden">
                <TextInput
                  className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                  placeholder="Menge"
                  placeholderTextColor="#8E8E93"
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1 bg-white rounded-xl overflow-hidden">
                <TextInput
                  className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                  placeholder="Einheit"
                  placeholderTextColor="#8E8E93"
                  value={itemUnit}
                  onChangeText={setItemUnit}
                />
              </View>
            </View>

            <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-2 px-1">Kategorie</Text>
            <View className="mb-6">
              <CategorySelector selected={itemCategory} onSelect={setItemCategory} />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={resetModal} className="flex-1 bg-white py-3.5 rounded-xl items-center">
                <Text className="text-[17px] font-semibold text-[#007AFF]">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddItem}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#34C759' }}
              >
                <Text className="text-[17px] font-semibold text-white">Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
