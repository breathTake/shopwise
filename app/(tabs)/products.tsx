import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-6 pb-2">
        <Text className="text-3xl font-bold text-gray-900">Produkte</Text>
        <Text className="text-base text-gray-500 mt-1">{products.length} gespeicherte Produkte</Text>
      </View>

      <View className="px-4 mb-3">
        <TextInput
          className="bg-white rounded-xl px-4 py-3 text-gray-900 text-base shadow-sm"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 }}
          placeholder="🔍  Produkt suchen..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setFilterCategory(null)}
          className={`px-3 py-1.5 rounded-full border ${
            filterCategory === null ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'
          }`}
        >
          <Text className={`text-sm font-medium ${filterCategory === null ? 'text-white' : 'text-gray-600'}`}>
            Alle
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${
              filterCategory === cat ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className="text-sm">{CATEGORY_ICONS[cat]}</Text>
            <Text className={`text-sm font-medium ${filterCategory === cat ? 'text-white' : 'text-gray-600'}`}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View
            className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between shadow-sm"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-xl">{CATEGORY_ICONS[item.category]}</Text>
              <View>
                <Text className="text-base font-medium text-gray-900">{item.name}</Text>
                <Text className="text-xs text-gray-400">
                  {CATEGORY_LABELS[item.category]}
                  {item.defaultUnit ? ` · ${item.defaultUnit}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} className="p-2">
              <Text className="text-gray-400">✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<EmptyState emoji="📦" title="Keine Produkte" />}
      />

      <FAB onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Neues Produkt</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-3"
              placeholder="Produktname..."
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-4"
              placeholder="Einheit (z.B. kg, Stück, L)..."
              value={unit}
              onChangeText={setUnit}
            />
            <Text className="text-sm font-semibold text-gray-700 mb-2">Kategorie</Text>
            <View className="mb-6">
              <CategorySelector selected={category} onSelect={setCategory} />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setModalVisible(false); setName(''); setUnit(''); setCategory('sonstiges'); }}
                className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                className="flex-1 bg-primary-600 py-3.5 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
