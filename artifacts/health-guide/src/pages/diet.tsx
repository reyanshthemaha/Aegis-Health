import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Salad, Search, CheckCircle2, XCircle, Sun, Coffee, UtensilsCrossed,
  Apple, Zap, Lightbulb, ChevronRight, Loader2, Sparkles, Leaf,
  AlertTriangle, Info, RotateCcw
} from "lucide-react";
import { useAnalyzeDiet } from "@workspace/api-client-react";
import type { DietGuide } from "@workspace/api-client-react";

const POPULAR_CONDITIONS = [
  "Diabetes", "Hypertension", "PCOS", "Thyroid", "Anemia",
  "GERD / Acid Reflux", "High Cholesterol", "Kidney Disease",
  "Fatty Liver", "Arthritis", "Migraine", "IBS",
];

const IMPACT_COLORS = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const SEVERITY_COLORS = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  low: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const MEAL_TABS = [
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Salad },
  { id: "dinner", label: "Dinner", icon: UtensilsCrossed },
  { id: "snacks", label: "Snacks", icon: Apple },
] as const;

type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";

export default function DietPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [mealTab, setMealTab] = useState<MealKey>("breakfast");
  const analyzeDiet = useAnalyzeDiet();

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    setSubmitted(q.trim());
    setMealTab("breakfast");
    analyzeDiet.mutate({ data: { query: q.trim() } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleReset = () => {
    setQuery("");
    setSubmitted("");
    analyzeDiet.reset();
  };

  const data: DietGuide | undefined = analyzeDiet.data;
  const isLoading = analyzeDiet.isPending;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {[
          { pos: "-left-24 -top-24", size: "w-80 h-80", color: "bg-emerald-400/20" },
          { pos: "-right-16 bottom-0", size: "w-64 h-64", color: "bg-teal-300/20" },
        ].map((o, i) => (
          <motion.div key={i} className={`absolute ${o.pos} ${o.size} rounded-full blur-3xl ${o.color}`}
            animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 6 + i * 2 }} />
        ))}

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5">
              <Leaf className="w-3.5 h-3.5 text-emerald-300" />
              Personalized Nutrition by Dr. Mahajan
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              Food & Diet <span className="text-emerald-300">Guide</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              Type any disease or condition — get a complete, AI-powered nutrition guide with foods to eat, avoid, meal plans and more.
            </p>

            {/* Search */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="relative flex items-center gap-3">
                <Search className="absolute left-5 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension, PCOS, Thyroid…"
                  className="w-full pl-12 pr-40 py-4.5 py-[18px] rounded-2xl border border-white/20 bg-white/10 backdrop-blur text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-white/15 transition-all text-base shadow-xl"
                />
                <motion.button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="absolute right-2 h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isLoading ? "Analyzing…" : "Analyze"}
                </motion.button>
              </div>
            </form>

            {/* Popular conditions */}
            {!data && !isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-2 mt-6">
                {POPULAR_CONDITIONS.map(c => (
                  <motion.button key={c} whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setQuery(c); handleSearch(c); }}
                    className="text-xs px-3.5 py-1.5 rounded-full border border-white/20 text-white/80 hover:bg-white/15 hover:text-white transition-all font-medium backdrop-blur">
                    {c}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Loading ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-16 h-16">
              <motion.div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-900" />
              <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500"
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🥗</div>
            </div>
            <p className="text-foreground font-bold text-lg">Building your diet guide for <span className="text-emerald-600 dark:text-emerald-400">"{submitted}"</span>…</p>
            <p className="text-muted-foreground text-sm">Dr. Mahajan is curating evidence-based nutrition recommendations</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      {analyzeDiet.isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="max-w-lg mx-auto mt-16 text-center px-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Couldn't generate diet guide</h3>
          <p className="text-muted-foreground text-sm mb-4">Please try again with a different search term.</p>
          <button onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </motion.div>
      )}

      {/* ── Results ── */}
      {data && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          className="max-w-5xl mx-auto px-4 py-10 space-y-8">

          {/* Header + reset */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Diet Guide</span>
              </div>
              <h2 className="text-3xl font-black text-foreground">{data.condition}</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{data.overview}</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <RotateCcw className="w-3.5 h-3.5" /> New search
            </motion.button>
          </div>

          {/* Foods to Eat + Avoid grid */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Foods to Eat */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-foreground text-lg">Foods to Eat</h3>
                <span className="ml-auto text-xs text-muted-foreground">{data.foodsToEat.length} items</span>
              </div>
              <div className="space-y-3">
                {data.foodsToEat.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-0.5">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{item.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${IMPACT_COLORS[item.impact as keyof typeof IMPACT_COLORS] ?? IMPACT_COLORS.medium}`}>
                            {item.impact} impact
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.examples.map((ex, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Foods to Avoid */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-bold text-foreground text-lg">Foods to Avoid</h3>
                <span className="ml-auto text-xs text-muted-foreground">{data.foodsToAvoid.length} items</span>
              </div>
              <div className="space-y-3">
                {data.foodsToAvoid.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-0.5">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{item.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${SEVERITY_COLORS[item.severity as keyof typeof SEVERITY_COLORS] ?? SEVERITY_COLORS.medium}`}>
                            {item.severity} risk
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.examples.map((ex, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 bg-white dark:bg-card border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-full font-medium">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Meal Plan */}
          <div className="bg-white dark:bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 border-b border-teal-100 dark:border-teal-900/30">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Sun className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Sample Daily Meal Plan
              </h3>
              <p className="text-muted-foreground text-sm mt-1">Tailored meal options for {data.condition}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border overflow-x-auto">
              {MEAL_TABS.map(tab => (
                <motion.button key={tab.id} whileTap={{ scale: 0.97 }}
                  onClick={() => setMealTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors flex-1 justify-center ${
                    mealTab === tab.id ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {mealTab === tab.id && (
                    <motion.span layoutId="meal-tab-bar"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={mealTab}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="p-6 space-y-3">
                {(data.mealPlan[mealTab] ?? []).map((option, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(64 + i + 1)}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{option}</p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Key Nutrients */}
          <div>
            <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Key Nutrients
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.keyNutrients.map((n, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white dark:bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-foreground">{n.name}</h4>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{n.dailyAmount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{n.benefit}</p>
                  <div className="flex flex-wrap gap-1">
                    {n.sources.map((s, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/15 dark:to-purple-900/15 rounded-3xl border border-violet-100 dark:border-violet-900/30 p-6">
            <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-violet-500" /> Practical Tips
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.tips.map((tip, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{data.disclaimer}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
