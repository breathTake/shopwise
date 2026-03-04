import { TouchableOpacity, Text } from 'react-native';

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center"
      style={{ backgroundColor: '#34C759' }}
    >
      <Text className="text-white text-3xl font-light">+</Text>
    </TouchableOpacity>
  );
}
