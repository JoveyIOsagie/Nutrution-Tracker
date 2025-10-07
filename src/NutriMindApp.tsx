// replace direct library imports with primitives:
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info, Download, Footprints, CupSoda, Minus, Plus,
  Weight as WeightIcon,      // ✅ alias Weight to WeightIcon
  Home, UtensilsCrossed, Sparkles, User,
  X as XIcon,                // ✅ alias X to XIcon
  Heart, Star, Trash2, RotateCcw, PlusCircle, Camera, Barcode, Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AnimatedDiv } from "@/components/ui/animated";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Line, LineChart } from "recharts";
import { storage } from "@/lib/storage";
import { clamp, uid, projectWeeklyLoss, gradeDay, toLiters } from "@/utils/calc";


const initialRecipes = [
  { id: 1, title: "Salmon Power Bowl", category: "High Protein", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop&q=60" },
  { id: 2, title: "Green Immunity Smoothie", category: "Immune Support", img: "https://images.unsplash.com/photo-1511689660979-10d79c049a0d?w=1200&auto=format&fit=crop&q=60" },
  { id: 3, title: "Mediterranean Chickpea Bowl", category: "Balanced", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop&q=60" }
];

const sampleWeightSeries = Array.from({ length: 14 }).map((_, i) => ({ day: `D${i + 1}`, weight: 150 - i * 0.3 }));

const load = (k: string, fallback: any) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function NutriMindApp() {
  const [page, setPage] = useState<"dashboard" | "recipes" | "recommendations" | "profile">("dashboard");
  const [calorieTarget, setCalorieTarget] = useState(load("nm_calorieTarget", 1800));
  const [consumed, setConsumed] = useState(load("nm_consumed", 1200));
  const [exerciseCals, setExerciseCals] = useState(load("nm_exercise", 250));
  const [stepsGoal, setStepsGoal] = useState(load("nm_stepsGoal", 7000));
  const [steps, setSteps] = useState(load("nm_steps", 5800));
  const [waterGoalMl, setWaterGoalMl] = useState(load("nm_waterGoal", 2500));
  const [waterMl, setWaterMl] = useState(load("nm_water", 1000));
  const [weight, setWeight] = useState(load("nm_weight", 150));
  const [macroRatios, setMacroRatios] = useState(load("nm_macroRatios", { carbs: 40, protein: 30, fat: 30 }));
  const [microTargets, setMicroTargets] = useState(load("nm_microTargets", { fiber_g: 28, vitaminC_mg: 75, iron_mg: 18 }));
  const [recipes, setRecipes] = useState(load("nm_recipes", initialRecipes));
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>(load("nm_favorites", []));
  const [skipped, setSkipped] = useState<number[]>(load("nm_skipped", []));
  const [rejected, setRejected] = useState<number[]>(load("nm_rejected", []));
  const [foods, setFoods] = useState<any[]>(load("nm_foods", []));
  const [recentFoods, setRecentFoods] = useState<any[]>(load("nm_recent", [
    { id: "oatmeal", name: "Oatmeal & Berries", kcal: 320 },
    { id: "salmon", name: "Grilled Salmon", kcal: 450 },
    { id: "yogurt", name: "Greek Yogurt & Honey", kcal: 180 }
  ]));
  const [fabOpen, setFabOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState("");
  const [quickAddKcal, setQuickAddKcal] = useState("");
  const [quickAddFiber, setQuickAddFiber] = useState("");
  const [quickAddVitC, setQuickAddVitC] = useState("");
  const [quickAddIron, setQuickAddIron] = useState("");
  const [quickAddMeal, setQuickAddMeal] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("breakfast");
  const [addOpen, setAddOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [photoConfirm, setPhotoConfirm] = useState<any>(null);
  const [selectedImageName, setSelectedImageName] = useState("");

  const net = consumed - exerciseCals;
  const progressPct = clamp((net / calorieTarget) * 100, 0, 100);
  const weeklyProjection = projectWeeklyLoss(calorieTarget, consumed, exerciseCals);
  const todayGrade = gradeDay(net, calorieTarget);

  const targets = useMemo(() => {
    const c = Math.max(0, Number(macroRatios.carbs) || 0);
    const p = Math.max(0, Number(macroRatios.protein) || 0);
    const f = Math.max(0, Number(macroRatios.fat) || 0);
    const sum = c + p + f || 1;
    const nc = (c / sum) * 100, np = (p / sum) * 100, nf = (f / sum) * 100;
    return {
      carbsPct: nc, proteinPct: np, fatPct: nf,
      carbs: Math.round(((nc / 100) * calorieTarget) / 4),
      protein: Math.round(((np / 100) * calorieTarget) / 4),
      fat: Math.round(((nf / 100) * calorieTarget) / 9)
    };
  }, [macroRatios, calorieTarget]);

  const consumedMacros = useMemo(() => ({
    carbs: Math.round((((targets.carbsPct) / 100) * Math.max(0, net)) / 4),
    protein: Math.round((((targets.proteinPct) / 100) * Math.max(0, net)) / 4),
    fat: Math.round((((targets.fatPct) / 100) * Math.max(0, net)) / 9)
  }), [net, targets]);

  const mealsByType = useMemo(() => {
    const map: Record<string, any[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    foods.forEach((f) => { if (map[f.meal]) map[f.meal].push(f); });
    return map;
  }, [foods]);

  useEffect(() => save("nm_calorieTarget", calorieTarget), [calorieTarget]);
  useEffect(() => save("nm_consumed", consumed), [consumed]);
  useEffect(() => save("nm_exercise", exerciseCals), [exerciseCals]);
  useEffect(() => save("nm_steps", steps), [steps]);
  useEffect(() => save("nm_stepsGoal", stepsGoal), [stepsGoal]);
  useEffect(() => save("nm_water", waterMl), [waterMl]);
  useEffect(() => save("nm_waterGoal", waterGoalMl), [waterGoalMl]);
  useEffect(() => save("nm_weight", weight), [weight]);
  useEffect(() => save("nm_macroRatios", macroRatios), [macroRatios]);
  useEffect(() => save("nm_microTargets", microTargets), [microTargets]);
  useEffect(() => save("nm_recipes", recipes), [recipes]);
  useEffect(() => save("nm_favorites", favorites), [favorites]);
  useEffect(() => save("nm_skipped", skipped), [skipped]);
  useEffect(() => save("nm_rejected", rejected), [rejected]);
  useEffect(() => save("nm_foods", foods), [foods]);
  useEffect(() => save("nm_recent", recentFoods), [recentFoods]);

  const coachTip = useMemo(() => {
    const waterPct = waterMl / Math.max(1, waterGoalMl);
    if (waterPct < 0.6) return `Hydration boost: you're at ${Math.round(waterPct * 100)}% of your ${toLiters(waterGoalMl)}L goal — take 3–4 big sips now.`;
    const proteinGap = Math.max(0, targets.protein - consumedMacros.protein);
    if (proteinGap > 15) return `Protein push: you're ~${proteinGap}g short of today's target — add Greek yogurt or eggs to your next meal.`;
    const stepsPct = steps / Math.max(1, stepsGoal);
    if (stepsPct < 0.7) return `Step it up: ${steps} / ${stepsGoal} — a 15‑min brisk walk will close the gap.`;
    if (net < calorieTarget * 0.85) return `Fuel gently: you still have ${(calorieTarget - net)} kcal — consider a fiber‑rich snack to round out the day.`;
    return "Nice pacing — keep your meals balanced and finish strong.";
  }, [waterMl, waterGoalMl, targets, consumedMacros, steps, stepsGoal, net, calorieTarget]);

  const currentRecipe = recipes[recipeIndex];
  const moveNext = () => setRecipeIndex((p) => (p + 1) % Math.max(1, recipes.length));
  const likeRecipe = () => { if (!currentRecipe) return; setFavorites((f) => Array.from(new Set([...f, currentRecipe.id]))); moveNext(); };
  const skipRecipe = () => { if (!currentRecipe) return; setSkipped((s) => Array.from(new Set([...s, currentRecipe.id]))); moveNext(); };
  const hardNoRecipe = () => { if (!currentRecipe) return; setRejected((r) => Array.from(new Set([...r, currentRecipe.id]))); setRecipes((rs: any[]) => rs.filter((r) => r.id !== currentRecipe.id)); setRecipeIndex(0); };
  const superLike = () => { if (!currentRecipe) return; setFavorites((f) => [currentRecipe.id, ...f.filter((id) => id !== currentRecipe.id)]); moveNext(); };
  const undo = () => setRecipeIndex((p) => (p - 1 + Math.max(1, recipes.length)) % Math.max(1, recipes.length));

  const setFabOpenSafe = (v: boolean | ((prev: boolean) => boolean)) => setFabOpen(typeof v === "function" ? (v as any)(fabOpen) : v);

  const addFoodFromText = () => {
    if (!quickAdd.trim()) return;
    const kcal = quickAddKcal !== "" ? Number(quickAddKcal) : Math.max(50, Math.min(900, quickAdd.length * 10));
    const item = { id: uid(), meal: quickAddMeal, name: quickAdd, kcal };
    setFoods((fs) => [item, ...fs]);
    setConsumed((c: number) => c + kcal);
    setRecentFoods((r) => [{ id: quickAdd.toLowerCase().replace(/\s+/g, "-"), name: quickAdd, kcal }, ...r.slice(0, 9)]);
    setQuickAdd(""); setQuickAddKcal(""); setQuickAddFiber(""); setQuickAddVitC(""); setQuickAddIron("");
    setAddOpen(false);
  };

  const addRepeatFood = (f: any, meal: string) => {
    const item = { id: uid(), meal, name: f.name, kcal: f.kcal };
    setFoods((fs) => [item, ...fs]);
    setConsumed((c: number) => c + f.kcal);
  };

  const estimateMicros = (name = "", kcal = 0) => {
    const n = name.toLowerCase();
    if (n.includes("salad")) return { fiber_g: 5, vitaminC_mg: 20, iron_mg: 1 };
    if (n.includes("smoothie")) return { fiber_g: 4, vitaminC_mg: 60, iron_mg: 0.5 };
    if (n.includes("bowl") || n.includes("grain")) return { fiber_g: 7, vitaminC_mg: 15, iron_mg: 2 };
    if (n.includes("yogurt")) return { fiber_g: 0, vitaminC_mg: 2, iron_mg: 0.1 };
    if (n.includes("salmon")) return { fiber_g: 0, vitaminC_mg: 0, iron_mg: 0.5 };
    return { fiber_g: Math.round((kcal || 400) * 0.005), vitaminC_mg: Math.round((kcal || 400) * 0.1), iron_mg: Number(((kcal || 400) * 0.002).toFixed(1)) };
  };

  const mockImageRecognition = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.includes("salad")) return { name: "Chicken Salad", kcal: 420, ...estimateMicros("Chicken Salad", 420) };
    if (lower.includes("smoothie")) return { name: "Green Smoothie", kcal: 280, ...estimateMicros("Green Smoothie", 280) };
    if (lower.includes("bowl")) return { name: "Grain Bowl", kcal: 520, ...estimateMicros("Grain Bowl", 520) };
    return { name: "Meal", kcal: 400, ...estimateMicros("Meal", 400) };
  };

  const onImageSelected = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pred = mockImageRecognition(file.name);
    setSelectedImageName(file.name);
    setPhotoConfirm(pred);
  };

  const confirmPhotoAdd = () => {
    if (!photoConfirm) return;
    const item = { id: uid(), meal: quickAddMeal, name: photoConfirm.name, kcal: photoConfirm.kcal };
    setFoods((fs) => [item, ...fs]);
    setConsumed((c: number) => c + photoConfirm.kcal);
    setRecentFoods((r) => [{ id: photoConfirm.name.toLowerCase().replace(/\s+/g, "-"), name: photoConfirm.name, kcal: photoConfirm.kcal }, ...r.slice(0, 9)]);
    setPhotoConfirm(null);
    setFabOpenSafe(false);
  };

  const downloadReport = () => {
    const lines = [
      "NutriMind Daily Report (Sample)",
      `Calorie target: ${calorieTarget} kcal`,
      `Consumed: ${consumed} kcal`,
      `Exercise: ${exerciseCals} kcal`,
      `Net: ${net} kcal`,
      `Grade: ${todayGrade}`,
      `Projection: ${weeklyProjection.toFixed(2)} lb/week`,
      `Favorites: ${favorites.join(", ")}`
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nutrimind-daily-report.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    console.log("\n[NutriMind Tests v4]\n-------------------");
    console.assert(["dashboard", "recipes", "recommendations", "profile"].includes(page), "Valid page");
    const sumPct = (Number(macroRatios.carbs)||0) + (Number(macroRatios.protein)||0) + (Number(macroRatios.fat)||0);
    console.assert(sumPct > 0, "Macro ratios present");
    console.assert(initialRecipes.length >= 1, "Has seed recipes");
    console.assert(typeof projectWeeklyLoss(2000, 1800, 200) === 'number', "Projection returns number");
    console.assert(["A","B","C","D"].includes(gradeDay(1800, 2000)), "GradeDay returns A-D");
    console.assert(typeof mockImageRecognition === 'function', 'mockImageRecognition exists');
    const tMicros = estimateMicros('test meal', 400);
    console.assert(['fiber_g','vitaminC_mg','iron_mg'].every(k=>k in tMicros), 'estimateMicros returns keys');
  }, []);

  const SectionTitle: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <h2 className="text-lg font-semibold mb-3 tracking-tight font-serif">{children}</h2>
  );

  const MacroChip: React.FC<{label: string; value: number; target: number}> = ({ label, value, target }) => {
    const pct = clamp((value / Math.max(1, target)) * 100, 0, 100);
    return (
      <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-emerald-100/70 bg-white/70 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-medium">{value}g / {target}g</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-emerald-100/70 overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      </motion.div>
    );
  };

  const MealList: React.FC<{title: string; items: any[]}> = ({ title, items }) => (
    <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <SectionTitle>{title}</SectionTitle>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No items yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between text-sm">
                <span>{i.name}</span>
                <span className="text-gray-600">{i.kcal} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const Hero = () => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6">
      <div className="relative z-10">
        <h1 className="font-serif text-3xl font-semibold text-emerald-800 tracking-tight">Today's Goal</h1>
        <p className="text-gray-600 mt-1">Stay within <b>{calorieTarget}</b> kcal, hydrate {toLiters(waterGoalMl)}L, and hit {stepsGoal.toLocaleString()} steps.</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <MacroChip label="Carbs" value={consumedMacros.carbs} target={targets.carbs} />
          <MacroChip label="Protein" value={consumedMacros.protein} target={targets.protein} />
          <MacroChip label="Fat" value={consumedMacros.fat} target={targets.fat} />
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm text-emerald-900/90">
          <Info className="h-4 w-4 mt-0.5" />
          <span className="leading-snug"><b>Coach tip:</b> {coachTip}</span>
        </div>
      </div>
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-200/30 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-emerald-100/30 blur-2xl" />
    </motion.div>
  );

  const Dashboard = () => (
    <div className="grid gap-6 pb-32 max-w-5xl mx-auto px-6">
      <Hero />
      <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-serif">Today</h1>
              <p className="text-gray-600 mt-1">Net calories: <b>{net}</b> / <b>{calorieTarget}</b></p>
              <div className="bg-emerald-100/60 rounded-full h-3 mt-2 w-full md:w-96">
                <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-2 text-sm text-gray-500">Grade: <b>{todayGrade}</b> · Projection: <b>{weeklyProjection.toFixed(2)} lb/week</b></p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input className="border rounded px-3 py-2 w-28" type="number" value={exerciseCals} onChange={(e) => setExerciseCals(Number(e.target.value || 0))} placeholder="Exercise kcal" />
              <input className="border rounded px-3 py-2 w-28" type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(Number(e.target.value || 0))} placeholder="Target kcal" />
              <Button onClick={downloadReport} className="active:scale-95 transition-transform"><Download className="mr-2 h-4 w-4"/>Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <SectionTitle>Steps</SectionTitle>
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="h-5 w-5"/>
              <input className="border rounded px-3 py-2 w-40" type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value || 0))} />
            </div>
            <p className="text-xs text-gray-500">Goal: {stepsGoal.toLocaleString()} · Progress: {Math.round((steps/Math.max(1,stepsGoal))*100)}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <SectionTitle>Water</SectionTitle>
            <div className="flex items-center gap-3">
              <CupSoda className="h-5 w-5"/>
              <Button variant="outline" className="active:scale-95" onClick={() => setWaterMl((w: number) => Math.max(0, w - 250))}><Minus className="h-4 w-4 mr-1"/>-250ml</Button>
              <span className="text-lg font-medium w-28 text-center">{waterMl} ml</span>
              <Button className="active:scale-95" onClick={() => setWaterMl((w: number) => w + 250)}><Plus className="h-4 w-4 mr-1"/>+250ml</Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Goal: {toLiters(waterGoalMl)}L · Progress: {Math.round((waterMl/Math.max(1,waterGoalMl))*100)}%</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <MealList title="Breakfast" items={mealsByType.breakfast} />
        <MealList title="Lunch" items={mealsByType.lunch} />
        <MealList title="Dinner" items={mealsByType.dinner} />
        <MealList title="Snacks" items={mealsByType.snacks} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <SectionTitle>Daily Advice</SectionTitle>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>{coachTip}</li>
              <li>Hydration: {toLiters(waterMl)}L / {toLiters(waterGoalMl)}L</li>
              <li>Steps: {steps} / {stepsGoal.toLocaleString()}</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <SectionTitle>Trend</SectionTitle>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleWeightSeries} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[145, 151]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <WeightIcon className="h-4 w-4"/>
              <input className="border rounded px-3 py-1 w-24" type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value || 0))} />
              <span className="text-sm text-gray-500">Update today's weight</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const Recipes = () => (
    <div className="grid gap-6 pb-32 max-w-5xl mx-auto px-6">
      <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3 text-center font-serif">Recipe Discovery</h2>
          {currentRecipe ? (
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <motion.img
                key={currentRecipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                src={currentRecipe.img}
                alt={currentRecipe.title}
                className="w-full h-64 object-cover rounded-2xl shadow-md ring-1 ring-emerald-100" />
              <div className="flex flex-col items-center md:items-start">
                <h3 className="text-xl font-medium text-center md:text-left font-serif">{currentRecipe.title}</h3>
                <p className="text-gray-500 mb-4 text-center md:text-left">{currentRecipe.category}</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={skipRecipe} variant="outline" className="active:scale-95" aria-label="Not now"><XIcon className="mr-2 h-4 w-4"/>Not now</Button>
                  <Button onClick={likeRecipe} className="active:scale-95" aria-label="Like"><Heart className="mr-2 h-4 w-4"/>Like</Button>
                  <Button onClick={superLike} variant="outline" className="active:scale-95" aria-label="Super Like"><Star className="mr-2 h-4 w-4"/>Super</Button>
                  <Button onClick={hardNoRecipe} variant="outline" className="active:scale-95" aria-label="No"><Trash2 className="mr-2 h-4 w-4"/>No</Button>
                  <Button onClick={undo} variant="ghost" className="active:scale-95" aria-label="Undo"><RotateCcw className="mr-2 h-4 w-4"/>Undo</Button>
                </div>
                <p className="mt-3 text-sm text-gray-500">Favorites: {favorites.length} · Not now: {skipped.length} · No: {rejected.length}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">You've reached the end of today's deck. Come back tomorrow for more!</p>
          )}
        </CardContent>
      </Card>

      {favorites.length > 0 && (
        <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <SectionTitle>Your Favorites</SectionTitle>
            <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recipes.concat(initialRecipes).filter((r: any) => favorites.includes(r.id)).slice(0, 9).map((r: any) => (
                <li key={r.id} className="text-sm">
                  <img src={r.img} alt={r.title} className="w-full h-32 object-cover rounded-lg"/>
                  <p className="mt-1 font-medium font-serif">{r.title}</p>
                  <p className="text-gray-500">{r.category}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const Recommendations = () => {
    const remaining = Math.max(0, calorieTarget - net);
    const suggestionPool = [
      { name: "Greek Yogurt", kcal: 120, badge: "High Protein" },
      { name: "Avocado Toast", kcal: 250, badge: "Healthy Fats" },
      { name: "Apple & Peanut Butter", kcal: 220, badge: "Balanced" },
      { name: "Grilled Shrimp", kcal: 200, badge: "Lean Protein" },
      { name: "Minestrone Soup", kcal: 180, badge: "Fiber" },
    ];
    const recs = suggestionPool.filter((x) => x.kcal <= remaining + 50);

    return (
      <div className="grid gap-6 pb-32 max-w-5xl mx-auto px-6">
        <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2 font-serif">Recommendations</h2>
            <p className="text-sm text-gray-600 mb-4">Based on your remaining budget ({remaining} kcal), here are picks to hit your goals.</p>
            <ul className="grid md:grid-cols-2 gap-3">
              {(recs.length ? recs : suggestionPool).map((x) => (
                <li key={x.name} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium font-serif">{x.name}</p>
                    <p className="text-xs text-gray-500">{x.badge} · {x.kcal} kcal</p>
                  </div>
                  <Button className="active:scale-95" onClick={() => addRepeatFood({ name: x.name, kcal: x.kcal }, "snacks")}>Add</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  const Profile = () => (
    <div className="grid gap-6 pb-28 max-w-3xl mx-auto px-6">
      <Card className="rounded-2xl border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-3 font-serif">Profile — Targets & Preferences</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-serif font-semibold mb-2">Calories & Activity</h3>
              <label className="text-sm block mb-2">Daily Calorie Target
                <input className="block border rounded px-3 py-2 mt-1 w-44" type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(Number(e.target.value || 0))} />
              </label>
              <label className="text-sm block mb-2">Exercise (kcal today)
                <input className="block border rounded px-3 py-2 mt-1 w-44" type="number" value={exerciseCals} onChange={(e) => setExerciseCals(Number(e.target.value || 0))} />
              </label>
              <label className="text-sm block mb-2">Steps Goal
                <input className="block border rounded px-3 py-2 mt-1 w-44" type="number" value={stepsGoal} onChange={(e) => setStepsGoal(Number(e.target.value || 0))} />
              </label>
              <label className="text-sm block mb-2">Water Goal (ml)
                <input className="block border rounded px-3 py-2 mt-1 w-44" type="number" value={waterGoalMl} onChange={(e) => setWaterGoalMl(Number(e.target.value || 0))} />
              </label>
            </div>
            <div>
              <h3 className="font-serif font-semibold mb-2">Macro Ratios (%)</h3>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm">Carbs
                  <input className="block border rounded px-3 py-2 mt-1 w-24" type="number" value={macroRatios.carbs} onChange={(e) => setMacroRatios({ ...macroRatios, carbs: Number(e.target.value || 0) })} />
                </label>
                <label className="text-sm">Protein
                  <input className="block border rounded px-3 py-2 mt-1 w-24" type="number" value={macroRatios.protein} onChange={(e) => setMacroRatios({ ...macroRatios, protein: Number(e.target.value || 0) })} />
                </label>
                <label className="text-sm">Fat
                  <input className="block border rounded px-3 py-2 mt-1 w-24" type="number" value={macroRatios.fat} onChange={(e) => setMacroRatios({ ...macroRatios, fat: Number(e.target.value || 0) })} />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">We auto-normalize to 100% if the sum differs.</p>
              <div className="mt-2 text-sm text-gray-700">Current grams/day target: C {targets.carbs}g · P {targets.protein}g · F {targets.fat}g</div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="font-serif font-semibold mb-2">Micronutrient Targets (demo)</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <label className="text-sm">Fiber (g)
                <input className="block border rounded px-3 py-2 mt-1 w-32" type="number" value={microTargets.fiber_g} onChange={(e) => setMicroTargets({ ...microTargets, fiber_g: Number(e.target.value || 0) })} />
              </label>
              <label className="text-sm">Vitamin C (mg)
                <input className="block border rounded px-3 py-2 mt-1 w-32" type="number" value={microTargets.vitaminC_mg} onChange={(e) => setMicroTargets({ ...microTargets, vitaminC_mg: Number(e.target.value || 0) })} />
              </label>
              <label className="text-sm">Iron (mg)
                <input className="block border rounded px-3 py-2 mt-1 w-32" type="number" value={microTargets.iron_mg} onChange={(e) => setMicroTargets({ ...microTargets, iron_mg: Number(e.target.value || 0) })} />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tracking UI for micros will be added to the food log in a later step.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const FabSheet = () => (
    <>
      {fabOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setFabOpenSafe(false)} />
      )}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <Button className="rounded-full h-16 w-16 shadow-xl bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-200/60 active:scale-95" onClick={() => setFabOpenSafe((v: any) => !v)} aria-label="Add">
          <PlusCircle className="h-6 w-6" />
        </Button>
      </div>

      {fabOpen && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-4 z-50 w-[92vw] max-w-md border border-emerald-100">
          <h3 className="text-sm font-semibold mb-3 font-serif">Add to today</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Button variant="outline" className="active:scale-95" onClick={() => { setQuickAddMeal("breakfast"); setAddOpen(true); }}>Breakfast</Button>
            <Button variant="outline" className="active:scale-95" onClick={() => { setQuickAddMeal("lunch"); setAddOpen(true); }}>Lunch</Button>
            <Button variant="outline" className="active:scale-95" onClick={() => { setQuickAddMeal("dinner"); setAddOpen(true); }}>Dinner</Button>
            <Button variant="outline" className="active:scale-95" onClick={() => { setQuickAddMeal("snacks"); setAddOpen(true); }}>Snacks</Button>
            <label className="border rounded-lg px-3 py-2 flex items-center justify-center cursor-pointer active:scale-95">
              <Camera className="h-4 w-4 mr-2"/>AI meal scan
              <input type="file" accept="image/*" className="hidden" onChange={onImageSelected} />
            </label>
            <Button variant="outline" className="active:scale-95" onClick={() => setBarcodeOpen(true)}><Barcode className="h-4 w-4 mr-2"/>Barcode</Button>
            <Button variant="outline" className="active:scale-95" onClick={() => setExerciseCals((e: number) => e + 100)}>Exercise +100</Button>
            <Button variant="outline" className="active:scale-95" onClick={() => setWaterMl((w: number) => w + 250)}>Water +250ml</Button>
            <Button variant="outline" className="active:scale-95" onClick={() => setWeight((w: number) => w - 0)}>Weight</Button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl p-5 w-[92vw] max-w-md border border-emerald-100">
              <h3 className="text-lg font-semibold mb-2 capitalize font-serif">Add to {quickAddMeal}</h3>
              <input className="border rounded px-3 py-2 w-full" placeholder="e.g., Greek Yogurt with Honey" value={quickAdd} onChange={(e) => setQuickAdd(e.target.value)} />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" className="active:scale-95" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="active:scale-95" onClick={addFoodFromText}><Check className="h-4 w-4 mr-1"/>Add</Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: Or quick-add one of your recent foods below.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {recentFoods.map((f) => (
                  <Button key={f.id} variant="outline" className="active:scale-95" onClick={() => { addRepeatFood(f, quickAddMeal); setAddOpen(false); }}>{f.name} · {f.kcal} kcal</Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {barcodeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setBarcodeOpen(false)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl p-5 w-[92vw] max-w-md border border-emerald-100">
              <h3 className="text-lg font-semibold mb-2 font-serif">Barcode Scan (Demo)</h3>
              <input className="border rounded px-3 py-2 w-full" placeholder="Enter or paste barcode" value={barcodeValue} onChange={(e) => setBarcodeValue(e.target.value)} />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" className="active:scale-95" onClick={() => setBarcodeOpen(false)}>Cancel</Button>
                <Button className="active:scale-95" onClick={() => { const kcal = 180; const name = `Item ${barcodeValue || "123456"}`; addRepeatFood({ name, kcal }, "snacks"); setBarcodeOpen(false); setBarcodeValue(""); }}>Add</Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">In production, this would query a barcode → nutrition database.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {photoConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPhotoConfirm(null)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl p-5 w-[92vw] max-w-md border border-emerald-100">
              <h3 className="text-lg font-semibold mb-2 font-serif">Confirm meal from photo</h3>
              <p className="text-sm text-gray-700">Detected: <b>{photoConfirm.name}</b> · {photoConfirm.kcal} kcal</p>
              <p className="text-xs text-gray-500 mb-3">Source: {selectedImageName}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="active:scale-95" onClick={() => setPhotoConfirm(null)}>Edit/Cancel</Button>
                <Button className="active:scale-95" onClick={confirmPhotoAdd}><Check className="h-4 w-4 mr-1"/>Confirm</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t z-30 shadow-[0_-6px_20px_-12px_rgba(16,185,129,0.25)]">
      <div className="max-w-5xl mx-auto grid grid-cols-5 items-center py-2 px-4 gap-1">
        <Button
          variant={page === "dashboard" ? "default" : "ghost"}
          className={`${page === "dashboard" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""} justify-center active:scale-95`}
          onClick={() => setPage("dashboard")}
          aria-label="Dashboard"
        >
          <Home className="h-5 w-5"/>
        </Button>

        <Button
          variant={page === "recipes" ? "default" : "ghost"}
          className={`${page === "recipes" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""} justify-center active:scale-95`}
          onClick={() => setPage("recipes")}
          aria-label="Recipes"
        >
          <UtensilsCrossed className="h-5 w-5"/>
        </Button>

        <div className="flex items-center justify-center"><FabSheet /></div>

        <Button
          variant={page === "recommendations" ? "default" : "ghost"}
          className={`${page === "recommendations" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""} justify-center active:scale-95`}
          onClick={() => setPage("recommendations")}
          aria-label="Recommendations"
        >
          <Sparkles className="h-5 w-5"/>
        </Button>

        <Button
          variant={page === "profile" ? "default" : "ghost"}
          className={`${page === "profile" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""} justify-center active:scale-95`}
          onClick={() => setPage("profile")}
          aria-label="Profile"
        >
          <User className="h-5 w-5"/>
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-emerald-50/40">
      <main className="py-6">
        {page === "dashboard" && <Dashboard />}
        {page === "recipes" && <Recipes />}
        {page === "recommendations" && <Recommendations />}
        {page === "profile" && <Profile />}
      </main>
      <BottomNav />
      <div style={{ background: "#fafafa", color: "black", padding: 20 }}>
</div>
    </div>
  );
}
