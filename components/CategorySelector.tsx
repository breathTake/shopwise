import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { Category, CATEGORIES, CATEGORY_ICONS } from '../types';

interface CategorySelectorProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
      <View className="flex-row gap-2">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            className={`px-3 py-2 rounded-xl ${selected === cat ? 'bg-primary-600' : 'bg-gray-100'}`}
          >
            <Text className="text-lg">{CATEGORY_ICONS[cat]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
