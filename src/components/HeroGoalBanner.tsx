import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  goalTitle: string;
  calories?: string;
  steps?: string;
  water?: string;
};

export default function HeroGoalBanner({
  goalTitle,
  calories = "1800 kcal",
  steps = "3,200 / 8,000",
  water = "1.2L / 2L",
}: Props) {
  return (
    <LinearGradient
      colors={["#f2f1ef", "#e9e7e4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <Text style={styles.title}>{goalTitle}</Text>
      <View style={styles.row}>
        <Text style={styles.item}>Calorie Goal: {calories}</Text>
        <Text style={styles.item}>Steps: {steps}</Text>
        <Text style={styles.item}>Water: {water}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  row: {
    gap: 4,
  },
  item: {
    color: "#555",
  },
});
