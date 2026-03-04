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
      <Text className="text-[17px] font-semibold text-[#1C1C1E]">{title}</Text>
      {subtitle && <Text className="text-[15px] text-[#8E8E93] mt-1">{subtitle}</Text>}
    </View>
  );
}
