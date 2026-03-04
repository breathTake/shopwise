import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useShoppingStore } from '../../store/useShoppingStore';
import { useProductStore } from '../../store/useProductStore';
import { Category, CATEGORY_LABELS, CATEGORY_ICONS, ShoppingItem, ShoppingList } from '../../types';
import { CategorySelector } from '../../components/CategorySelector';
import { EmptyState } from '../../components/EmptyState';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ViewMode = 'lists' | 'combined';
const DEFAULT_UNIT = 'Stück';

// ─── ListCard ────────────────────────────────────────────────────────────────

interface ListCardProps {
  list: ShoppingList;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onToggleItem: (listId: string, itemId: string) => void;
}

function ListCard({ list, expanded, onToggleExpand, onOpen, onDelete, onDuplicate, onToggleItem }: ListCardProps) {
  const checkedCount = list.items.filter((i) => i.checked).length;
  const totalCount = list.items.length;

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    list.items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups) as [Category, ShoppingItem[]][];
  }, [list.items]);

  return (
    <View
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      {/* Clean header: name + chevron only */}
      <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.7} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-gray-900 flex-shrink" numberOfLines={1}>
                {list.name}
              </Text>
              {list.isTemplate && (
                <View className="bg-primary-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  <Text className="text-xs text-primary-700 font-medium">Vorlage</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-gray-400 mt-0.5">
              {totalCount === 0 ? 'Leer' : `${checkedCount}/${totalCount} erledigt`}
            </Text>
          </View>
          <Text className="text-gray-400 text-base">{expanded ? '▴' : '▾'}</Text>
        </View>

        {totalCount > 0 && (
          <View className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded content */}
      {expanded && (
        <View className="px-4 pb-4">
          <View className="h-px bg-gray-100 mb-3" />

          {groupedItems.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-2">Liste ist leer</Text>
          ) : (
            groupedItems.map(([category, items]) => (
              <View key={category} className="mb-3">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                </Text>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onToggleItem(list.id, item.id)}
                    className="flex-row items-center py-2 gap-3"
                    activeOpacity={0.6}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0 ${
                        item.checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                      }`}
                    >
                      {item.checked && (
                        <Text className="text-white font-bold" style={{ fontSize: 9 }}>✓</Text>
                      )}
                    </View>
                    <Text
                      className={`flex-1 text-sm ${
                        item.checked ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-400">{item.quantity} {item.unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}

          {/* Actions in expanded footer */}
          <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
            <TouchableOpacity
              onPress={onOpen}
              className="flex-1 bg-primary-50 py-2.5 rounded-xl items-center"
            >
              <Text className="text-sm font-semibold text-primary-700">Öffnen →</Text>
            </TouchableOpacity>
            {onDuplicate && (
              <TouchableOpacity
                onPress={onDuplicate}
                className="bg-gray-100 px-3 py-2.5 rounded-xl items-center"
              >
                <Text className="text-sm font-semibold text-gray-600">📋</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onDelete}
              className="bg-red-50 px-3 py-2.5 rounded-xl items-center"
            >
              <Text className="text-sm font-semibold text-red-500">Löschen</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ListsScreen() {
  const router = useRouter();
  const {
    lists, standaloneItems,
    createList, deleteList, duplicateList,
    toggleItem, addItemToList,
    addStandaloneItem, toggleStandaloneItem, removeStandaloneItem, clearCheckedStandaloneItems,
  } = useShoppingStore();
  const { products } = useProductStore();

  const [viewMode, setViewMode] = useState<ViewMode>('lists');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // FAB speed dial
  const [fabOpen, setFabOpen] = useState(false);

  // New list modal
  const [listModalVisible, setListModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);

  // Add product modal — no pre-selected list
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState(DEFAULT_UNIT);
  const [itemCategory, setItemCategory] = useState<Category>('sonstiges');

  const regularLists = useMemo(() => lists.filter((l) => !l.isTemplate), [lists]);
  const templates = useMemo(() => lists.filter((l) => l.isTemplate), [lists]);

  // Autocomplete: starts at length > 0
  const filteredProducts = useMemo(
    () => itemName.length > 0
      ? products.filter((p) => p.name.toLowerCase().includes(itemName.toLowerCase()))
      : [],
    [products, itemName],
  );

  // Standalone items grouped by category
  const standaloneGroups = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    standaloneItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups) as [Category, ShoppingItem[]][];
  }, [standaloneItems]);

  const combinedGroups = useMemo(() => {
    if (viewMode !== 'combined') return [];
    const groups: Record<string, { item: ShoppingItem; listId: string; listName: string }[]> = {};

    regularLists.forEach((list) => {
      list.items.forEach((item) => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push({ item, listId: list.id, listName: list.name });
      });
    });
    // Include standalone items with a special label
    standaloneItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push({ item, listId: '__standalone__', listName: 'Allgemein' });
    });

    return Object.entries(groups) as [Category, { item: ShoppingItem; listId: string; listName: string }[]][];
  }, [regularLists, standaloneItems, viewMode]);

  function toggleExpanded(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    if (!newListName.trim()) return;
    const navigate = !isTemplate;
    const id = createList(newListName.trim(), isTemplate);
    setNewListName('');
    setIsTemplate(false);
    setListModalVisible(false);
    if (navigate) router.push(`/list/${id}`);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Liste löschen', `"${name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteList(id) },
    ]);
  }

  function handleDuplicate(id: string) {
    const newId = duplicateList(id);
    router.push(`/list/${newId}`);
  }

  function openListModal() {
    setFabOpen(false);
    setListModalVisible(true);
  }

  function openProductModal() {
    setFabOpen(false);
    setSelectedListId(null); // no pre-selection
    setProductModalVisible(true);
  }

  function handleSelectProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItemName(product.name);
    setItemCategory(product.category);
    setItemUnit(product.defaultUnit ?? DEFAULT_UNIT);
    setItemQuantity(String(product.defaultQuantity ?? 1));
  }

  function handleAddProduct() {
    if (!itemName.trim()) return;
    const item = {
      name: itemName.trim(),
      category: itemCategory,
      quantity: parseFloat(itemQuantity) || 1,
      unit: itemUnit.trim() || DEFAULT_UNIT,
      checked: false,
    };
    if (selectedListId) {
      addItemToList(selectedListId, item);
    } else {
      addStandaloneItem(item);
    }
    resetProductModal();
  }

  function resetProductModal() {
    setProductModalVisible(false);
    setSelectedListId(null);
    setItemName('');
    setItemQuantity('1');
    setItemUnit(DEFAULT_UNIT);
    setItemCategory('sonstiges');
  }

  function handleToggleCombined(listId: string, itemId: string) {
    if (listId === '__standalone__') {
      toggleStandaloneItem(itemId);
    } else {
      toggleItem(listId, itemId);
    }
  }

  const checkedStandaloneCount = standaloneItems.filter((i) => i.checked).length;
  const hasContent = lists.length > 0 || standaloneItems.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with View Switch */}
      <View className="px-4 pt-6 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-gray-900">Shopwise</Text>
          <Text className="text-base text-gray-500 mt-0.5">Deine Einkaufslisten</Text>
        </View>
        <View className="flex-row bg-gray-200 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setViewMode('lists')}
            className={`px-3 py-1.5 rounded-lg ${viewMode === 'lists' ? 'bg-white' : ''}`}
            style={viewMode === 'lists' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 } : {}}
          >
            <Text className={`text-sm font-medium ${viewMode === 'lists' ? 'text-gray-900' : 'text-gray-500'}`}>
              Listen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('combined')}
            className={`px-3 py-1.5 rounded-lg ${viewMode === 'combined' ? 'bg-white' : ''}`}
            style={viewMode === 'combined' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 } : {}}
          >
            <Text className={`text-sm font-medium ${viewMode === 'combined' ? 'text-gray-900' : 'text-gray-500'}`}>
              Gesamt
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {viewMode === 'lists' ? (
          <>
            {/* Vorlagen */}
            {templates.length > 0 && (
              <>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Vorlagen
                </Text>
                {templates.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    expanded={expandedIds.has(list.id)}
                    onToggleExpand={() => toggleExpanded(list.id)}
                    onOpen={() => router.push(`/list/${list.id}`)}
                    onDelete={() => handleDelete(list.id, list.name)}
                    onDuplicate={() => handleDuplicate(list.id)}
                    onToggleItem={toggleItem}
                  />
                ))}
              </>
            )}

            {/* Aktuelle Listen */}
            {regularLists.length > 0 && (
              <>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Aktuelle Listen
                </Text>
                {regularLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    expanded={expandedIds.has(list.id)}
                    onToggleExpand={() => toggleExpanded(list.id)}
                    onOpen={() => router.push(`/list/${list.id}`)}
                    onDelete={() => handleDelete(list.id, list.name)}
                    onToggleItem={toggleItem}
                  />
                ))}
              </>
            )}

            {/* Andere Artikel (standalone) */}
            {standaloneItems.length > 0 && (
              <>
                <View className="flex-row items-center justify-between mt-4 mb-2">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Andere Artikel
                  </Text>
                  {checkedStandaloneCount > 0 && (
                    <TouchableOpacity onPress={clearCheckedStandaloneItems}>
                      <Text className="text-xs text-red-400 font-medium">Erledigte löschen</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
                >
                  {standaloneGroups.map(([category, items], groupIdx) => (
                    <View key={category}>
                      <View className="px-4 pt-3 pb-1">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                        </Text>
                      </View>
                      {items.map((item, idx) => (
                        <View
                          key={item.id}
                          className={`flex-row items-center px-4 py-3 ${
                            idx < items.length - 1 ? 'border-b border-gray-50' : ''
                          }`}
                        >
                          <TouchableOpacity
                            onPress={() => toggleStandaloneItem(item.id)}
                            className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0 ${
                              item.checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                            }`}
                          >
                            {item.checked && (
                              <Text className="text-white font-bold" style={{ fontSize: 9 }}>✓</Text>
                            )}
                          </TouchableOpacity>
                          <View className="flex-1">
                            <Text className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {item.name}
                            </Text>
                            <Text className="text-xs text-gray-400">{item.quantity} {item.unit}</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeStandaloneItem(item.id)} className="p-2">
                            <Text className="text-gray-300">✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      {groupIdx < standaloneGroups.length - 1 && (
                        <View className="h-px bg-gray-100 mx-4" />
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {!hasContent && (
              <EmptyState emoji="🛒" title="Keine Listen" subtitle="Erstelle deine erste Einkaufsliste" />
            )}
          </>
        ) : (
          <>
            {combinedGroups.length === 0 ? (
              <EmptyState emoji="🛒" title="Keine Artikel" subtitle="Füge Artikel zu deinen Listen hinzu" />
            ) : (
              combinedGroups.map(([category, entries]) => (
                <View key={category} className="mb-5">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                  </Text>
                  {entries.map(({ item, listId, listName }) => (
                    <View
                      key={`${listId}-${item.id}`}
                      className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center"
                      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
                    >
                      <TouchableOpacity
                        onPress={() => handleToggleCombined(listId, item.id)}
                        className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0 ${
                          item.checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                        }`}
                      >
                        {item.checked && <Text className="text-white text-xs">✓</Text>}
                      </TouchableOpacity>
                      <View className="flex-1">
                        <Text className={`text-base font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {item.name}
                        </Text>
                        <Text className="text-xs text-gray-400">{item.quantity} {item.unit}</Text>
                      </View>
                      <View className="bg-primary-50 px-2 py-1 rounded-full ml-2">
                        <Text className="text-xs text-primary-700 font-medium">{listName}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* FAB Speed Dial */}
      {fabOpen && (
        <>
          <TouchableOpacity
            onPress={() => setFabOpen(false)}
            className="absolute inset-0"
            activeOpacity={0}
            style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
          />
          <View className="absolute bottom-28 right-4 gap-3 items-end">
            <TouchableOpacity
              onPress={openListModal}
              className="flex-row items-center gap-3 bg-white rounded-2xl pl-4 pr-3 py-3"
              style={{ shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 }}
            >
              <Text className="text-sm font-semibold text-gray-800">Neue Liste</Text>
              <View className="w-9 h-9 bg-primary-600 rounded-full items-center justify-center">
                <Text className="text-base">📋</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openProductModal}
              className="flex-row items-center gap-3 bg-white rounded-2xl pl-4 pr-3 py-3"
              style={{ shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 }}
            >
              <Text className="text-sm font-semibold text-gray-800">Artikel hinzufügen</Text>
              <View className="w-9 h-9 bg-primary-600 rounded-full items-center justify-center">
                <Text className="text-base">🛒</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        onPress={() => setFabOpen(!fabOpen)}
        className="absolute bottom-8 right-4 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: fabOpen ? '#374151' : '#16a34a',
          shadowColor: fabOpen ? '#000' : '#16a34a',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Text className="text-white text-2xl font-light">{fabOpen ? '✕' : '+'}</Text>
      </TouchableOpacity>

      {/* ── Neue Liste Modal ── */}
      <Modal visible={listModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => { setListModalVisible(false); setNewListName(''); setIsTemplate(false); }}
          />
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Neue Liste</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-4"
              placeholder="Name der Liste..."
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
              onSubmitEditing={handleCreate}
            />
            <TouchableOpacity
              onPress={() => setIsTemplate(!isTemplate)}
              className="flex-row items-center gap-3 mb-6"
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
                  isTemplate ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                }`}
              >
                {isTemplate && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-gray-700">Als Vorlage speichern</Text>
            </TouchableOpacity>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setListModalVisible(false); setNewListName(''); setIsTemplate(false); }}
                className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                className="flex-1 bg-primary-600 py-3.5 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Erstellen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Artikel hinzufügen Modal ── */}
      <Modal visible={productModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={resetProductModal} />
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Artikel hinzufügen</Text>

            {/* List Picker — no auto-selection */}
            {regularLists.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Zu Liste hinzufügen (optional)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {regularLists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      onPress={() => setSelectedListId(selectedListId === list.id ? null : list.id)}
                      className={`px-3 py-2 rounded-xl ${
                        selectedListId === list.id ? 'bg-primary-600' : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedListId === list.id ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {list.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {!selectedListId && (
                  <Text className="text-xs text-gray-400 mt-1.5">
                    Keine Liste → wird unter "Andere Artikel" gespeichert
                  </Text>
                )}
              </View>
            )}

            {/* Product search with autocomplete */}
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base mb-1"
              placeholder="🔍  Produkt suchen oder eingeben..."
              value={itemName}
              onChangeText={setItemName}
              autoFocus
            />
            {filteredProducts.length > 0 && (
              <ScrollView style={{ maxHeight: 110 }} className="mb-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
                {filteredProducts.slice(0, 5).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleSelectProduct(p.id)}
                    className="flex-row items-center gap-2 py-2.5 px-3 border-b border-gray-50"
                  >
                    <Text>{CATEGORY_ICONS[p.category]}</Text>
                    <Text className="text-sm text-gray-800 flex-1">{p.name}</Text>
                    <Text className="text-xs text-gray-400">{p.defaultUnit ?? ''}</Text>
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
              <TouchableOpacity onPress={resetProductModal} className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center">
                <Text className="text-gray-700 font-semibold">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddProduct}
                disabled={!itemName.trim()}
                className={`flex-1 py-3.5 rounded-xl items-center ${itemName.trim() ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <Text className={`font-semibold ${itemName.trim() ? 'text-white' : 'text-gray-400'}`}>
                  {selectedListId ? 'Zur Liste' : 'Hinzufügen'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
