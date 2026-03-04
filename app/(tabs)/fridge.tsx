import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">KI-Koch</Text>
          <Text className="text-base text-gray-500 mt-1">Was ist im Kühlschrank?</Text>
        </View>

        <View className="flex-row gap-2 mb-4">
          <TextInput
            className="flex-1 bg-white rounded-xl px-4 py-3 text-gray-900 text-base shadow-sm"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 }}
            placeholder="Zutat eingeben (Komma für mehrere)..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAdd}
            className="bg-primary-600 px-4 rounded-xl items-center justify-center"
          >
            <Text className="text-white text-xl font-semibold">+</Text>
          </TouchableOpacity>
        </View>

        {items.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold text-gray-700">
                🧊 Im Kühlschrank ({items.length})
              </Text>
              <TouchableOpacity onPress={clearAll}>
                <Text className="text-xs text-red-400 font-medium">Alles löschen</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => removeItem(item.id)}
                  className="bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                >
                  <Text className="text-sm text-primary-700 font-medium">{item.name}</Text>
                  <Text className="text-xs text-primary-400">✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleGetSuggestions}
          disabled={loading || items.length === 0}
          className={`py-4 rounded-2xl items-center mb-6 ${
            items.length === 0 ? 'bg-gray-200' : 'bg-primary-600'
          }`}
          style={items.length > 0 ? { shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 } : {}}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`text-base font-bold ${items.length === 0 ? 'text-gray-400' : 'text-white'}`}>
              🤖  Rezepte vorschlagen
            </Text>
          )}
        </TouchableOpacity>

        {suggestions.map((recipe, index) => (
          <View
            key={index}
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <Text className="text-lg font-bold text-gray-900 mb-1">{recipe.name}</Text>
            <Text className="text-sm text-gray-500 mb-3">{recipe.description}</Text>

            <View className="mb-3">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Vorhandene Zutaten
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {recipe.usedIngredients.map((ing, i) => (
                  <View key={i} className="bg-primary-50 px-2 py-1 rounded-lg">
                    <Text className="text-xs text-primary-700">✓ {ing}</Text>
                  </View>
                ))}
              </View>
            </View>

            {recipe.missingIngredients.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Fehlende Zutaten
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {recipe.missingIngredients.map((ing, i) => (
                    <View key={i} className="bg-orange-50 px-2 py-1 rounded-lg">
                      <Text className="text-xs text-orange-600">✗ {ing}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Zubereitung
              </Text>
              {recipe.instructions.map((step, i) => (
                <Text key={i} className="text-sm text-gray-600 mb-1">
                  {i + 1}. {step}
                </Text>
              ))}
            </View>

            {recipe.missingIngredients.length > 0 && (
              <TouchableOpacity
                onPress={() => handleCreateShoppingList(recipe)}
                className="bg-primary-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-semibold text-sm">
                  🛒  Fehlende Zutaten einkaufen
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
