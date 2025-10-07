import * as React from "react";
import { ScrollView, View, Text } from "react-native";
import HeroGoalBanner from "../components/HeroGoalBanner";

export default function Dashboard() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9f8f7", padding: 16 }}>
      <HeroGoalBanner goalTitle="Today's Goal" />
      <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12 }}>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>Meals</Text>
        <Text>Breakfast: Oatmeal with berries</Text>
        <Text>Lunch: Salmon & rice</Text>
        <Text>Dinner: Veggie stir-fry</Text>
        <Text>Snacks: Greek yogurt</Text>
      </View>
    </ScrollView>
  );
}
