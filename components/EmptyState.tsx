import { View, Text } from 'react-native';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-20">
      <Text className="text-5xl mb-4">{emoji}</Text>
      <Text className="text-lg font-semibold text-gray-700">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-400 mt-1">{subtitle}</Text>}
    </View>
  );
}
