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
import { Category, CATEGORY_LABELS, CATEGORY_ICONS, ShoppingItem } from '../../types';
import { CategorySelector } from '../../components/CategorySelector';
import { EmptyState } from '../../components/EmptyState';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ViewMode = 'lists' | 'combined';
const DEFAULT_UNIT = 'Stück';

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
  const [fabOpen, setFabOpen] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState(DEFAULT_UNIT);
  const [itemCategory, setItemCategory] = useState<Category>('sonstiges');

  const regularLists = useMemo(() => lists.filter((l) => !l.isTemplate), [lists]);
  const templates = useMemo(() => lists.filter((l) => l.isTemplate), [lists]);

  const filteredProducts = useMemo(
    () => itemName.length > 0 ? products.filter((p) => p.name.toLowerCase().includes(itemName.toLowerCase())) : [],
    [products, itemName],
  );

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

  function openListModal() { setFabOpen(false); setListModalVisible(true); }
  function openProductModal() {
    setFabOpen(false);
    setSelectedListId(null);
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
    const item = { name: itemName.trim(), category: itemCategory, quantity: parseFloat(itemQuantity) || 1, unit: itemUnit.trim() || DEFAULT_UNIT, checked: false };
    if (selectedListId) { addItemToList(selectedListId, item); } else { addStandaloneItem(item); }
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
    if (listId === '__standalone__') { toggleStandaloneItem(itemId); } else { toggleItem(listId, itemId); }
  }

  const checkedStandaloneCount = standaloneItems.filter((i) => i.checked).length;
  const hasContent = lists.length > 0 || standaloneItems.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="font-bold text-[#1C1C1E]" style={{ fontSize: 34 }}>Shopwise</Text>
          <Text className="text-[#8E8E93]" style={{ fontSize: 15 }}>Deine Einkaufslisten</Text>
        </View>
        <View className="flex-row bg-[#E5E5EA] rounded-lg p-0.5">
          <TouchableOpacity
            onPress={() => setViewMode('lists')}
            className={`px-3 py-1.5 rounded-md ${viewMode === 'lists' ? 'bg-white' : ''}`}
          >
            <Text className={`text-sm font-medium ${viewMode === 'lists' ? 'text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>Listen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('combined')}
            className={`px-3 py-1.5 rounded-md ${viewMode === 'combined' ? 'bg-white' : ''}`}
          >
            <Text className={`text-sm font-medium ${viewMode === 'combined' ? 'text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>Gesamt</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main scroll */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}>
        {viewMode === 'lists' ? (
          <>
            {/* Templates section */}
            {templates.length > 0 && (
              <>
                <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 mt-3 px-1">Vorlagen</Text>
                <View className="bg-white rounded-xl overflow-hidden mb-4">
                  {templates.map((list, idx) => {
                    const checked = list.items.filter(i => i.checked).length;
                    const total = list.items.length;
                    const exp = expandedIds.has(list.id);
                    return (
                      <View key={list.id}>
                        {idx > 0 && <View className="h-px bg-[#E5E5EA] ml-4" />}
                        <TouchableOpacity onPress={() => toggleExpanded(list.id)} activeOpacity={0.6} className="px-4 py-3.5">
                          <View className="flex-row items-center">
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2">
                                <Text className="text-[17px] font-medium text-[#1C1C1E]" numberOfLines={1}>{list.name}</Text>
                                <View className="bg-[#E5F7EB] px-2 py-0.5 rounded-full">
                                  <Text className="text-[11px] text-[#34C759] font-medium">Vorlage</Text>
                                </View>
                              </View>
                              <Text className="text-[13px] text-[#8E8E93] mt-0.5">{total === 0 ? 'Leer' : `${checked}/${total} erledigt`}</Text>
                            </View>
                            <Text className="text-[#8E8E93] text-base ml-2">{exp ? '▴' : '▾'}</Text>
                          </View>
                          {total > 0 && (
                            <View className="mt-2.5 h-1 bg-[#E5E5EA] rounded-full overflow-hidden">
                              <View className="h-full bg-[#34C759] rounded-full" style={{ width: `${(checked / total) * 100}%` }} />
                            </View>
                          )}
                        </TouchableOpacity>
                        {exp && (
                          <View className="px-4 pb-3 border-t border-[#E5E5EA]">
                            {list.items.length === 0 ? (
                              <Text className="text-[15px] text-[#8E8E93] py-2">Liste ist leer</Text>
                            ) : (
                              list.items.map(item => (
                                <TouchableOpacity key={item.id} onPress={() => toggleItem(list.id, item.id)} className="flex-row items-center py-2 gap-3">
                                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${item.checked ? 'bg-[#34C759] border-[#34C759]' : 'border-[#E5E5EA]'}`}>
                                    {item.checked && <Text className="text-white" style={{ fontSize: 10, fontWeight: '700' }}>✓</Text>}
                                  </View>
                                  <Text className={`flex-1 text-[15px] ${item.checked ? 'text-[#8E8E93] line-through' : 'text-[#1C1C1E]'}`}>{item.name}</Text>
                                  <Text className="text-[13px] text-[#8E8E93]">{item.quantity} {item.unit}</Text>
                                </TouchableOpacity>
                              ))
                            )}
                            <View className="flex-row gap-2 mt-2 pt-2 border-t border-[#E5E5EA]">
                              <TouchableOpacity onPress={() => router.push(`/list/${list.id}`)} className="flex-1 bg-[#F0FEF4] py-2 rounded-lg items-center">
                                <Text className="text-[15px] font-semibold text-[#34C759]">Öffnen →</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDuplicate(list.id)} className="bg-[#E5E5EA] px-3 py-2 rounded-lg items-center">
                                <Text className="text-[15px]">📋</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDelete(list.id, list.name)} className="bg-[#FFF1F0] px-3 py-2 rounded-lg items-center">
                                <Text className="text-[13px] font-semibold text-[#FF3B30]">Löschen</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Regular lists section */}
            {regularLists.length > 0 && (
              <>
                <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 mt-3 px-1">Aktuelle Listen</Text>
                <View className="bg-white rounded-xl overflow-hidden mb-4">
                  {regularLists.map((list, idx) => {
                    const checked = list.items.filter(i => i.checked).length;
                    const total = list.items.length;
                    const exp = expandedIds.has(list.id);
                    return (
                      <View key={list.id}>
                        {idx > 0 && <View className="h-px bg-[#E5E5EA] ml-4" />}
                        <TouchableOpacity onPress={() => toggleExpanded(list.id)} activeOpacity={0.6} className="px-4 py-3.5">
                          <View className="flex-row items-center">
                            <View className="flex-1">
                              <Text className="text-[17px] font-medium text-[#1C1C1E]" numberOfLines={1}>{list.name}</Text>
                              <Text className="text-[13px] text-[#8E8E93] mt-0.5">{total === 0 ? 'Leer' : `${checked}/${total} erledigt`}</Text>
                            </View>
                            <Text className="text-[#8E8E93] text-base ml-2">{exp ? '▴' : '▾'}</Text>
                          </View>
                          {total > 0 && (
                            <View className="mt-2.5 h-1 bg-[#E5E5EA] rounded-full overflow-hidden">
                              <View className="h-full bg-[#34C759] rounded-full" style={{ width: `${(checked / total) * 100}%` }} />
                            </View>
                          )}
                        </TouchableOpacity>
                        {exp && (
                          <View className="px-4 pb-3 border-t border-[#E5E5EA]">
                            {list.items.length === 0 ? (
                              <Text className="text-[15px] text-[#8E8E93] py-2">Liste ist leer</Text>
                            ) : (
                              list.items.map(item => (
                                <TouchableOpacity key={item.id} onPress={() => toggleItem(list.id, item.id)} className="flex-row items-center py-2 gap-3">
                                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${item.checked ? 'bg-[#34C759] border-[#34C759]' : 'border-[#E5E5EA]'}`}>
                                    {item.checked && <Text className="text-white" style={{ fontSize: 10, fontWeight: '700' }}>✓</Text>}
                                  </View>
                                  <Text className={`flex-1 text-[15px] ${item.checked ? 'text-[#8E8E93] line-through' : 'text-[#1C1C1E]'}`}>{item.name}</Text>
                                  <Text className="text-[13px] text-[#8E8E93]">{item.quantity} {item.unit}</Text>
                                </TouchableOpacity>
                              ))
                            )}
                            <View className="flex-row gap-2 mt-2 pt-2 border-t border-[#E5E5EA]">
                              <TouchableOpacity onPress={() => router.push(`/list/${list.id}`)} className="flex-1 bg-[#F0FEF4] py-2 rounded-lg items-center">
                                <Text className="text-[15px] font-semibold text-[#34C759]">Öffnen →</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDelete(list.id, list.name)} className="bg-[#FFF1F0] px-3 py-2 rounded-lg items-center">
                                <Text className="text-[13px] font-semibold text-[#FF3B30]">Löschen</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Standalone items section */}
            {standaloneItems.length > 0 && (
              <>
                <View className="flex-row items-center justify-between mt-3 mb-1 px-1">
                  <Text className="text-xs text-[#8E8E93] uppercase tracking-wide">Andere Artikel</Text>
                  {checkedStandaloneCount > 0 && (
                    <TouchableOpacity onPress={clearCheckedStandaloneItems}>
                      <Text className="text-xs text-[#FF3B30] font-medium">Erledigte löschen</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View className="bg-white rounded-xl overflow-hidden mb-4">
                  {standaloneGroups.map(([category, items], groupIdx) => (
                    <View key={category}>
                      {groupIdx > 0 && <View className="h-px bg-[#E5E5EA] ml-4" />}
                      <View className="px-4 pt-2.5 pb-1">
                        <Text className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                          {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                        </Text>
                      </View>
                      {items.map((item, idx) => (
                        <View key={item.id} className={`flex-row items-center px-4 py-3 ${idx < items.length - 1 ? 'border-b border-[#E5E5EA]' : ''}`}>
                          <TouchableOpacity
                            onPress={() => toggleStandaloneItem(item.id)}
                            className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${item.checked ? 'bg-[#34C759] border-[#34C759]' : 'border-[#E5E5EA]'}`}
                          >
                            {item.checked && <Text className="text-white" style={{ fontSize: 10, fontWeight: '700' }}>✓</Text>}
                          </TouchableOpacity>
                          <View className="flex-1">
                            <Text className={`text-[15px] ${item.checked ? 'text-[#8E8E93] line-through' : 'text-[#1C1C1E]'}`}>{item.name}</Text>
                            <Text className="text-[12px] text-[#8E8E93]">{item.quantity} {item.unit}</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeStandaloneItem(item.id)} className="p-2">
                            <Text className="text-[#8E8E93]">✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </>
            )}

            {!hasContent && <EmptyState emoji="🛒" title="Keine Listen" subtitle="Erstelle deine erste Einkaufsliste" />}
          </>
        ) : (
          <>
            {combinedGroups.length === 0 ? (
              <EmptyState emoji="🛒" title="Keine Artikel" subtitle="Füge Artikel zu deinen Listen hinzu" />
            ) : (
              combinedGroups.map(([category, entries]) => (
                <View key={category}>
                  <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 mt-3 px-1">
                    {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                  </Text>
                  <View className="bg-white rounded-xl overflow-hidden mb-2">
                    {entries.map(({ item, listId, listName }, idx) => (
                      <View key={`${listId}-${item.id}`} className={`flex-row items-center px-4 py-3.5 ${idx < entries.length - 1 ? 'border-b border-[#E5E5EA]' : ''}`}>
                        <TouchableOpacity
                          onPress={() => handleToggleCombined(listId, item.id)}
                          className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0 ${item.checked ? 'bg-[#34C759] border-[#34C759]' : 'border-[#E5E5EA]'}`}
                        >
                          {item.checked && <Text className="text-white" style={{ fontSize: 10, fontWeight: '700' }}>✓</Text>}
                        </TouchableOpacity>
                        <View className="flex-1">
                          <Text className={`text-[17px] ${item.checked ? 'text-[#8E8E93] line-through' : 'text-[#1C1C1E]'}`}>{item.name}</Text>
                          <Text className="text-[13px] text-[#8E8E93]">{item.quantity} {item.unit}</Text>
                        </View>
                        <View className="bg-[#E5F7EB] px-2 py-0.5 rounded-full ml-2">
                          <Text className="text-[11px] text-[#34C759] font-medium">{listName}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* FAB speed dial */}
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
              style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 5 }}
            >
              <Text className="text-[15px] font-semibold text-[#1C1C1E]">Neue Liste</Text>
              <View className="w-9 h-9 bg-[#34C759] rounded-full items-center justify-center">
                <Text className="text-base">📋</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openProductModal}
              className="flex-row items-center gap-3 bg-white rounded-2xl pl-4 pr-3 py-3"
              style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 5 }}
            >
              <Text className="text-[15px] font-semibold text-[#1C1C1E]">Artikel hinzufügen</Text>
              <View className="w-9 h-9 bg-[#34C759] rounded-full items-center justify-center">
                <Text className="text-base">🛒</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
      <TouchableOpacity
        onPress={() => setFabOpen(!fabOpen)}
        className="absolute bottom-8 right-4 w-14 h-14 rounded-full items-center justify-center"
        style={{ backgroundColor: fabOpen ? '#3A3A3C' : '#34C759' }}
      >
        <Text className="text-white text-2xl font-light">{fabOpen ? '✕' : '+'}</Text>
      </TouchableOpacity>

      {/* Neue Liste Modal */}
      <Modal visible={listModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => { setListModalVisible(false); setNewListName(''); setIsTemplate(false); }}
          />
          <View className="bg-[#F2F2F7] rounded-t-3xl pt-3 pb-8 px-4">
            <View className="w-9 h-1 bg-[#E5E5EA] rounded-full self-center mb-4" />
            <Text className="text-[22px] font-bold text-[#1C1C1E] mb-4">Neue Liste</Text>
            <View className="bg-white rounded-xl overflow-hidden mb-4">
              <TextInput
                className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                placeholder="Name der Liste..."
                placeholderTextColor="#8E8E93"
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
                onSubmitEditing={handleCreate}
              />
            </View>
            <TouchableOpacity
              onPress={() => setIsTemplate(!isTemplate)}
              className="flex-row items-center gap-3 bg-white rounded-xl px-4 py-3.5 mb-6"
            >
              <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${isTemplate ? 'bg-[#34C759] border-[#34C759]' : 'border-[#E5E5EA]'}`}>
                {isTemplate && <Text className="text-white" style={{ fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text className="text-[17px] text-[#1C1C1E]">Als Vorlage speichern</Text>
            </TouchableOpacity>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setListModalVisible(false); setNewListName(''); setIsTemplate(false); }}
                className="flex-1 bg-white py-3.5 rounded-xl items-center"
              >
                <Text className="text-[17px] font-semibold text-[#007AFF]">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: '#34C759' }}
              >
                <Text className="text-[17px] font-semibold text-white">Erstellen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Artikel Modal */}
      <Modal visible={productModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={resetProductModal} />
          <View className="bg-[#F2F2F7] rounded-t-3xl pt-3 pb-8 px-4">
            <View className="w-9 h-1 bg-[#E5E5EA] rounded-full self-center mb-4" />
            <Text className="text-[22px] font-bold text-[#1C1C1E] mb-4">Artikel hinzufügen</Text>
            {regularLists.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-2 px-1">Liste (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {regularLists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      onPress={() => setSelectedListId(selectedListId === list.id ? null : list.id)}
                      className={`px-3.5 py-2 rounded-full border ${selectedListId === list.id ? 'border-[#34C759]' : 'bg-white border-[#E5E5EA]'}`}
                      style={selectedListId === list.id ? { backgroundColor: '#34C759' } : {}}
                    >
                      <Text className={`text-[15px] font-medium ${selectedListId === list.id ? 'text-white' : 'text-[#1C1C1E]'}`}>{list.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {!selectedListId && <Text className="text-[12px] text-[#8E8E93] mt-1.5">Ohne Liste → Andere Artikel</Text>}
              </View>
            )}
            <View className="bg-white rounded-xl overflow-hidden mb-1">
              <TextInput
                className="px-4 py-3.5 text-[17px] text-[#1C1C1E]"
                placeholder="Produkt suchen..."
                placeholderTextColor="#8E8E93"
                value={itemName}
                onChangeText={setItemName}
                autoFocus
              />
            </View>
            {filteredProducts.length > 0 && (
              <View className="bg-white rounded-xl overflow-hidden mb-3">
                <ScrollView style={{ maxHeight: 110 }}>
                  {filteredProducts.slice(0, 5).map((p, idx) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => handleSelectProduct(p.id)}
                      className={`flex-row items-center gap-2 py-3 px-4 ${idx > 0 ? 'border-t border-[#E5E5EA]' : ''}`}
                    >
                      <Text>{CATEGORY_ICONS[p.category]}</Text>
                      <Text className="text-[15px] text-[#1C1C1E] flex-1">{p.name}</Text>
                      <Text className="text-[13px] text-[#8E8E93]">{p.defaultUnit ?? ''}</Text>
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
              <TouchableOpacity onPress={resetProductModal} className="flex-1 bg-white py-3.5 rounded-xl items-center">
                <Text className="text-[17px] font-semibold text-[#007AFF]">Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddProduct}
                disabled={!itemName.trim()}
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: itemName.trim() ? '#34C759' : '#E5E5EA' }}
              >
                <Text className={`text-[17px] font-semibold ${itemName.trim() ? 'text-white' : 'text-[#8E8E93]'}`}>
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
