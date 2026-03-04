import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFridgeStore } from '../../store/useFridgeStore';
import { useShoppingStore } from '../../store/useShoppingStore';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

interface SuggestedRecipe {
  name: string;
  description: string;
  usedIngredients: string[];
  missingIngredients: string[];
  instructions: string[];
}

export default function FridgeScreen() {
  const router = useRouter();
  const { items, addItem, removeItem, clearAll } = useFridgeStore();
  const { createListFromRecipe } = useShoppingStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([]);

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    trimmed.split(',').forEach((item) => {
      const name = item.trim();
      if (name) addItem(name);
    });
    setInput('');
  }

  async function handleGetSuggestions() {
    if (items.length === 0) {
      Alert.alert('Kühlschrank leer', 'Füge zuerst Zutaten hinzu.');
      return;
    }
    if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
      Alert.alert('API Key fehlt', 'Bitte füge deinen Anthropic API Key in .env.local ein.');
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const ingredientList = items.map((i) => i.name).join(', ');
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Ich habe folgende Zutaten: ${ingredientList}.

Schlage mir 3 einfache Gerichte vor, die ich damit kochen kann. Antworte NUR mit einem JSON-Array in folgendem Format (kein zusätzlicher Text):

[
  {
    "name": "Gerichtname",
    "description": "Kurze Beschreibung",
    "usedIngredients": ["Zutat1", "Zutat2"],
    "missingIngredients": ["fehlende Zutat1"],
    "instructions": ["Schritt 1", "Schritt 2", "Schritt 3"]
  }
]`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        try {
          const parsed: SuggestedRecipe[] = JSON.parse(content.text);
          setSuggestions(parsed);
        } catch {
          Alert.alert('Fehler', 'Antwort konnte nicht verarbeitet werden. Versuche es nochmal.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('401') || msg.includes('API key')) {
        Alert.alert('Fehler', 'Ungültiger API Key. Bitte prüfe deine .env.local Datei.');
      } else {
        Alert.alert('Fehler', 'Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCreateShoppingList(recipe: SuggestedRecipe) {
    const listId = createListFromRecipe(recipe.name, recipe.missingIngredients.map((name) => ({
      name,
      category: 'sonstiges' as const,
      quantity: 1,
      unit: 'Stück',
      checked: false,
    })));
    Alert.alert(
      'Einkaufsliste erstellt',
      `Fehlende Zutaten für "${recipe.name}" wurden zur Liste hinzugefügt.`,
      [
        { text: 'Zur Liste', onPress: () => router.push(`/list/${listId}`) },
        { text: 'OK' },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}>
        {/* Header */}
        <View className="pt-4 pb-2 mb-2">
          <Text className="font-bold text-[#1C1C1E]" style={{ fontSize: 34 }}>KI-Koch</Text>
          <Text className="text-[#8E8E93]" style={{ fontSize: 15 }}>Was ist im Kühlschrank?</Text>
        </View>

        {/* Input row */}
        <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">Zutat hinzufügen</Text>
        <View className="bg-white rounded-xl overflow-hidden mb-4 flex-row items-center">
          <TextInput
            className="flex-1 px-4 py-3.5 text-[17px] text-[#1C1C1E]"
            placeholder="Zutat eingeben (Komma für mehrere)..."
            placeholderTextColor="#8E8E93"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAdd}
            className="mr-2 w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: '#34C759' }}
          >
            <Text className="text-white text-xl font-semibold">+</Text>
          </TouchableOpacity>
        </View>

        {/* Fridge contents */}
        {items.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mb-1 px-1">
              <Text className="text-xs text-[#8E8E93] uppercase tracking-wide">Im Kühlschrank ({items.length})</Text>
              <TouchableOpacity onPress={clearAll}>
                <Text className="text-xs text-[#FF3B30] font-medium">Alles löschen</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-white rounded-xl px-4 py-3.5 mb-4">
              <View className="flex-row flex-wrap gap-2">
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => removeItem(item.id)}
                    className="bg-[#E5F7EB] border border-[#34C759] px-3 py-1.5 rounded-full flex-row items-center gap-1"
                  >
                    <Text className="text-[15px] text-[#34C759] font-medium">{item.name}</Text>
                    <Text className="text-[12px] text-[#34C759]">✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Suggest button */}
        <TouchableOpacity
          onPress={handleGetSuggestions}
          disabled={loading || items.length === 0}
          className="py-4 rounded-2xl items-center mb-6"
          style={{ backgroundColor: items.length === 0 ? '#E5E5EA' : '#34C759' }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className="font-bold"
              style={{ fontSize: 17, color: items.length === 0 ? '#8E8E93' : '#FFFFFF' }}
            >
              Rezepte vorschlagen
            </Text>
          )}
        </TouchableOpacity>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <>
            <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-1 px-1">Vorschläge</Text>
            {suggestions.map((recipe, index) => (
              <View key={index} className="bg-white rounded-xl overflow-hidden mb-4">
                {/* Recipe header */}
                <View className="px-4 pt-4 pb-3">
                  <Text className="text-[17px] font-semibold text-[#1C1C1E]">{recipe.name}</Text>
                  <Text className="text-[13px] text-[#8E8E93] mt-0.5">{recipe.description}</Text>
                </View>

                <View className="h-px bg-[#E5E5EA] mx-4" />

                {/* Available ingredients */}
                <View className="px-4 pt-3 pb-2">
                  <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-2">Vorhandene Zutaten</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {recipe.usedIngredients.map((ing, i) => (
                      <View key={i} className="bg-[#E5F7EB] px-2.5 py-1 rounded-full">
                        <Text className="text-[13px] text-[#34C759] font-medium">✓ {ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Missing ingredients */}
                {recipe.missingIngredients.length > 0 && (
                  <>
                    <View className="h-px bg-[#E5E5EA] mx-4" />
                    <View className="px-4 pt-3 pb-2">
                      <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-2">Fehlende Zutaten</Text>
                      <View className="flex-row flex-wrap gap-1.5">
                        {recipe.missingIngredients.map((ing, i) => (
                          <View key={i} className="bg-[#FFF3EC] px-2.5 py-1 rounded-full">
                            <Text className="text-[13px] text-[#FF9500] font-medium">✗ {ing}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                <View className="h-px bg-[#E5E5EA] mx-4" />

                {/* Instructions */}
                <View className="px-4 pt-3 pb-3">
                  <Text className="text-xs text-[#8E8E93] uppercase tracking-wide mb-2">Zubereitung</Text>
                  {recipe.instructions.map((step, i) => (
                    <View key={i} className="flex-row mb-2">
                      <View className="w-5 h-5 rounded-full items-center justify-center mr-2 mt-0.5" style={{ backgroundColor: '#34C759' }}>
                        <Text className="text-white font-bold" style={{ fontSize: 11 }}>{i + 1}</Text>
                      </View>
                      <Text className="flex-1 text-[15px] text-[#1C1C1E]">{step}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                {recipe.missingIngredients.length > 0 && (
                  <View className="px-4 pb-4">
                    <TouchableOpacity
                      onPress={() => handleCreateShoppingList(recipe)}
                      className="py-3.5 rounded-xl items-center"
                      style={{ backgroundColor: '#34C759' }}
                    >
                      <Text className="text-[17px] font-semibold text-white">Fehlende Zutaten einkaufen</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
