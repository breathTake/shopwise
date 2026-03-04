import { TouchableOpacity, Text } from 'react-native';

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-8 right-6 bg-primary-600 w-14 h-14 rounded-full items-center justify-center"
      style={{ shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
    >
      <Text className="text-white text-3xl font-light">+</Text>
    </TouchableOpacity>
  );
}
