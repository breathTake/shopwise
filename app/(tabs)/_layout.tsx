import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(242,242,247,0.94)' : '#F2F2F7',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 0.5,
          height: 88,
          paddingBottom: 28,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Listen',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Rezepte',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produkte',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'KI-Koch',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
