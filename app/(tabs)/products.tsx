import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '../../store/useProductStore';
import { Category, CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '../../types';
import { FAB } from '../../components/FAB';
import { EmptyState } from '../../components/EmptyState';
import { CategorySelector } from '../../components/CategorySelector';

export default function ProductsScreen() {
  const { products, addProduct, deleteProduct } = useProductStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('sonstiges');
  const [unit, setUnit] = useState('');

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory ? p.category === filterCategory : true;
    return matchSearch && matchCat;
  }), [products, search, filterCategory]);

  function handleAdd() {
    if (!name.trim()) return;
    addProduct({ name: name.trim(), category, defaultUnit: unit.trim() || undefined });
    setName('');
    setUnit('');
    setCategory('sonstiges');
    setModalVisible(false);
  }

  function handleDelete(id: string, productName: string) {
    Alert.alert('Produkt löschen', `"${productName}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteProduct(id) },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="font-bold text-[#1C1C1E]" style={{ fontSize: 34 }}>Produkte</Text>
        <Text className="text-[#8E8E93]" style={{ fontSize: 15 }}>{products.length} gespeicherte Produkte</Text>
      </View>

      {/* Search */}
      <View className="px-4 mb-3">
        <View className="bg-[#E5E5EA] rounded-xl flex-row items-center px-3">
          <Text className="text-[#8E8E93] mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-[17px] text-[#1C1C1E]"
            placeholder="Produkt suchen..."
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setFilterCategory(null)}
          className={`px-3 py-1.5 rounded-full border ${
            filterCategory === null ? 'border-[#34C759]' : 'bg-white border-[#E5E5EA]'
          }`}
          style={filterCategory === null ? { backgroundColor: '#34C759' } : {}}
        >
          <Text className={`text-[15px] font-medium ${filterCategory === null ? 'text-white' : 'text-[#1C1C1E]'}`}>
            Alle
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${
              filterCategory === cat ? 'border-[#34C759]' : 'bg-white border-[#E5E5EA]'
            }`}
            style={filterCategory === cat ? { backgroundColor: '#34C759' } : {}}
          >
            <Text className="text-[15px]">{CATEGORY_ICONS[cat]}</Text>
            <Text className={`text-[15px] font-medium ${filterCategory === cat ? 'text-white' : 'text-[#1C1C1E]'}`}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 }}
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">
              {filterCategory ? CATEGORY_LABELS[filterCategory] : 'Alle Produkte'}
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View>
            <View className={`bg-white flex-row items-center px-4 py-3.5 ${index === 0 ? 'rounded-t-xl' : ''} ${index === filtered.length - 1 ? 'rounded-b-xl' : ''}`}>
              <Text className="text-xl mr-3">{CATEGORY_ICONS[item.category]}</Text>
              <View className="flex-1">
                <Text className="text-[17px] font-medium text-[#1C1C1E]">{item.name}</Text>
                <Text className="text-[13px] text-[#8E8E93]">
                  {CATEGORY_LABELS[item.category]}{item.defaultUnit ? ` · ${item.defaultUnit}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} className="p-2">
                <Text className="text-[#8E8E93]">✕</Text>
              </TouchableOpacity>
            </View>
            {index < filtered.length - 1 && (
              <View className="h-px bg-[#E5E5EA] ml-4" />
            )}
          </View>
        )}
        ListEmptyComponent={<EmptyState emoji="📦" title="Keine Produkte" />}
      />

      <FAB onPress={() => setModalVisible(true)} />

      {/* Add Product Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => { setModalVisible(false); setName(''); setUnit(''); setCategory('sonstiges'); }}
          />
          <View className="bg-[#F2F2F7] rounded-t-3xl pt-3 pb-8 px-4">
            <View className="w-9 h-1 bg-[#E5E5EA] rounded-full self-center mb-4" />
            <Text className="text-[22px] font-bold text-[#1C1C1E] mb-4">Neues Produkt</Text>

            <View className="bg-white rounded-xl overflow-hidden mb-3">
              <TextInput
                className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                placeholder="Produktname..."
                placeholderTextColor="#8E8E93"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View className="bg-white rounded-xl overflow-hidden mb-4">
              <TextInput
                className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                placeholder="Einheit (z.B. kg, Stück, L)..."
                placeholderTextColor="#8E8E93"
                value={unit}
                onChangeText={setUnit}
              />
            </View>

            <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-2 px-1">Kategorie</Text>
            <View className="mb-6">
              <CategorySelector selected={category} onSelect={setCategory} />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setModalVisible(false); setName(''); setUnit(''); setCategory('sonstiges'); }}
                className="flex-1 bg-white py-3.5 rounded-xl items-center"
              >
                <Text className="text-[17px] font-semibold text-[#007AFF]">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
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
