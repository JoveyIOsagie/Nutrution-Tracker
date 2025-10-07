import { View, Text } from "react-native";

export default function CoachTip({ tip }: { tip: string }) {
  return (
    <View className="bg-luxe-card border border-luxe-border rounded-2xl p-4 shadow-soft">
      <Text className="text-sm font-serif text-luxe-ink">Coach tip of the day</Text>
      <Text className="text-[13px] text-luxe-sub mt-2 leading-5">
        {tip}
      </Text>
    </View>
  );
}
