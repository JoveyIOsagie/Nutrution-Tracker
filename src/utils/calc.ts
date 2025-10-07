export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const uid = () => Math.random().toString(36).slice(2);
export function projectWeeklyLoss(calorieTarget: number, consumed: number, exercise = 0) {
  const dailyDeficit = calorieTarget - (consumed - exercise);
  return (dailyDeficit * 7) / 3500;
}
export function gradeDay(net: number, target: number) {
  const pct = net / target;
  if (pct >= 0.9 && pct <= 1.1) return "A";
  if ((pct >= 0.8 && pct < 0.9) || (pct > 1.1 && pct <= 1.2)) return "B";
  if ((pct >= 0.7 && pct < 0.8) || (pct > 1.2 && pct <= 1.3)) return "C";
  return "D";
}
export const toLiters = (ml: number) => (ml / 1000).toFixed(1);
