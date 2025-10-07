import { View, Text, ScrollView } from "react-native";

export default function Profile() {
  return (
    <View className="flex-1 bg-luxe-bg">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-serif text-luxe-ink mb-2">Profile</Text>
        <Text className="text-luxe-sub">
          Customize targets (calories, steps, water, macros & micros) and app preferences here.
        </Text>
      </ScrollView>
    </View>
  );
}
