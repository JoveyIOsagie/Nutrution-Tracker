import { View, Text, ScrollView } from "react-native";

export default function Nutrition() {
  return (
    <View className="flex-1 bg-luxe-bg">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-serif text-luxe-ink mb-2">Nutrition</Text>
        <Text className="text-luxe-sub">
          Recipe discovery, logging, and micronutrient details will live here.
        </Text>
      </ScrollView>
    </View>
  );
}
