import { useState } from "react";
import { useCalculateBmi, BmiInputGender } from "@workspace/api-client-react";
import { Calculator, Scale, User, Dumbbell, Apple, Loader2, ChevronRight, Info, Heart, TrendingUp, Target, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as any } }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

interface BmiRange { label: string; min: number; max: number; color: string; bar: string; text: string; bg: string; dark: string; desc: string }
const BMI_RANGES: BmiRange[] = [
  { label: "Underweight", min: 0,    max: 18.5, color: "#3b82f6", bar: "bg-blue-400",    text: "text-blue-600 dark:text-blue-400",   bg: "from-blue-50 to-sky-50 border-blue-200",       dark: "dark:from-blue-900/20 dark:to-sky-900/20 dark:border-blue-900/40",    desc: "Below healthy weight range" },
  { label: "Normal",      min: 18.5, max: 25,   color: "#10b981", bar: "bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-50 to-green-50 border-emerald-200",  dark: "dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-900/40", desc: "Healthy weight for your height" },
  { label: "Overweight",  min: 25,   max: 30,   color: "#f59e0b", bar: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400",   bg: "from-amber-50 to-yellow-50 border-amber-200",    dark: "dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-900/40",  desc: "Above healthy weight range" },
  { label: "Obese",       min: 30,   max: 100,  color: "#ef4444", bar: "bg-red-400",     text: "text-red-600 dark:text-red-400",       bg: "from-red-50 to-rose-50 border-red-200",          dark: "dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-900/40",        desc: "Significantly above healthy weight" },
];

function getBmiRange(bmi: number) {
  return BMI_RANGES.find(r => bmi >= r.min && bmi < r.max) ?? BMI_RANGES[3];
}

/* Ideal weight calculation (Devine formula) */
function getIdealWeight(heightCm: number, gender: BmiInputGender) {
  const heightIn = heightCm / 2.54;
  const base = gender === "male" ? 50 : 45.5;
  const ideal = base + 2.3 * (heightIn - 60);
  return Math.max(ideal, 30);
}

/* SVG Arc gauge */
function BmiGauge({ bmi, color }: { bmi: number; color: string }) {
  const pct = Math.min(Math.max((bmi - 10) / (45 - 10), 0), 1);
  const r = 80; const cx = 100; const cy = 100;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (startDeg: number, endDeg: number, c: string, strokeW = 12) => {
    const s = toRad(startDeg - 90); const e = toRad(endDeg - 90);
    const x1 = cx + r * Math.cos(s); const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e); const y2 = cy + r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return <path key={c} d={`M${x1},${y1} A${r},${r},0,${large},1,${x2},${y2}`} fill="none" stroke={c} strokeWidth={strokeW} strokeLinecap="round" />;
  };
  const angle = -140 + pct * 280;
  const needleAngle = toRad(angle - 90);
  const nx = cx + 60 * Math.cos(needleAngle);
  const ny = cy + 60 * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[260px]">
      {/* Track */}
      {arcPath(-140, -65, "#bfdbfe")}
      {arcPath(-65, 0,   "#6ee7b7")}
      {arcPath(0,   65,  "#fde68a")}
      {arcPath(65,  140, "#fca5a5")}
      {/* Needle */}
      <motion.line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="3.5" strokeLinecap="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        initial={{ rotate: -140 }}
        animate={{ rotate: 0 }}
        transition={{ delay: 0.4, duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
      />
      <motion.circle cx={cx} cy={cy} r="6" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
      {/* BMI value */}
      <motion.text x={cx} y={cy + 30} textAnchor="middle" fontSize="22" fontWeight="900" fill={color}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>{bmi}</motion.text>
      {/* Range labels */}
      <text x="14"  y="122" fontSize="7.5" fill="#94a3b8">Under</text>
      <text x="67"  y="122" fontSize="7.5" fill="#94a3b8">Normal</text>
      <text x="115" y="122" fontSize="7.5" fill="#94a3b8">Over</text>
      <text x="158" y="122" fontSize="7.5" fill="#94a3b8">Obese</text>
    </svg>
  );
}

export default function Bmi() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge]       = useState("");
  const [gender, setGender] = useState<BmiInputGender>("male");
  const calcBmi = useCalculateBmi();
  const { data, isPending } = calcBmi;

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height) return;
    calcBmi.mutate({ data: { weight: Number(weight), height: Number(height), age: age ? Number(age) : undefined, gender } });
  };

  const bmiRange = data ? getBmiRange(data.bmi) : null;
  const idealWeight = height ? getIdealWeight(Number(height), gender) : null;
  const weightDiff = (data && idealWeight) ? (Number(weight) - idealWeight).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 py-16 px-4 relative overflow-hidden">
        {[
          { pos: "-right-20 -top-20", size: "w-72 h-72", dur: 9 },
          { pos: "-left-10 bottom-0", size: "w-60 h-60", dur: 11 },
        ].map((o, i) => (
          <motion.div key={i} className={`absolute ${o.pos} ${o.size} rounded-full bg-white/15 blur-3xl`}
            animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: o.dur }} />
        ))}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1400px] mx-auto text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display text-white mb-3">BMI & Wellness</h1>
          <p className="text-xl text-white/80 max-w-xl mx-auto">Calculate your Body Mass Index and get a personalised health, diet, and fitness plan.</p>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Form ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <div className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-6">
                <h2 className="font-bold text-xl text-slate-800 dark:text-foreground mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-500" /> Your Details
                </h2>
                <form onSubmit={handle} className="space-y-5">

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Weight (kg)</label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input type="number" step="0.1" min="1" max="500" placeholder="70"
                          value={weight} onChange={e => setWeight(e.target.value)} required
                          className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-sm font-semibold text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 transition" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Height (cm)</label>
                      <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input type="number" min="50" max="300" placeholder="175"
                          value={height} onChange={e => setHeight(e.target.value)} required
                          className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-sm font-semibold text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 transition" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Age (Optional)</label>
                    <input type="number" min="1" max="120" placeholder="e.g. 28"
                      value={age} onChange={e => setAge(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 transition" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Gender (Optional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["male", "female"] as BmiInputGender[]).map(g => (
                        <motion.button key={g} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setGender(g)}
                          className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${gender === g ? "bg-emerald-500 border-emerald-500 text-white shadow-md" : "border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:border-emerald-300"}`}>
                          {g === "male" ? "👨 Male" : "👩 Female"}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Ideal weight preview */}
                  {idealWeight && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Ideal Weight Range</span>
                      </div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">
                        <span className="font-black text-2xl">{(idealWeight - 5).toFixed(0)}–{(idealWeight + 5).toFixed(0)}</span> kg
                        <span className="text-emerald-600/70 dark:text-emerald-400/70 ml-2">(Devine formula)</span>
                      </p>
                    </motion.div>
                  )}

                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={isPending || !weight || !height}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-base">
                    {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Calculating...</>
                      : <><Calculator className="w-5 h-5" /> Calculate BMI</>}
                  </motion.button>
                </form>

                {/* BMI Reference table */}
                <div className="mt-6 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Info className="w-3 h-3" /> BMI Reference Scale</p>
                  {BMI_RANGES.map(r => (
                    <div key={r.label} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                        <span className="font-semibold text-slate-700 dark:text-foreground">{r.label}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{r.min}–{r.max === 100 ? "30+" : r.max}</span>
                        <span className="text-slate-400 text-[10px]">{r.desc}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Results ── */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!data && !isPending && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center bg-white/70 dark:bg-card/70 rounded-3xl border-2 border-dashed border-slate-200 dark:border-border">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                    <Scale className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-black font-display text-slate-600 dark:text-foreground mb-2">Enter Your Details</h3>
                  <p className="text-slate-400 dark:text-muted-foreground max-w-sm text-lg">Fill in your weight and height on the left to generate your personalised wellness report.</p>
                  <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-xs">
                    {[{ label: "Normal BMI", range: "18.5 – 24.9" }, { label: "Healthy Weight", range: "~60–75 kg" }, { label: "Ideal Exercise", range: "150 min/week" }, { label: "Daily Calories", range: "~2000 kcal" }].map(s => (
                      <div key={s.label} className="bg-slate-50 dark:bg-muted/30 rounded-2xl p-3 text-center border border-slate-100 dark:border-border">
                        <p className="text-slate-400 text-xs mb-0.5">{s.label}</p>
                        <p className="font-black text-slate-700 dark:text-foreground text-sm">{s.range}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {isPending && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm">
                  <div className="relative w-24 h-24 mb-8">
                    <motion.div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-900" />
                    <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
                    <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-b-teal-400" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calculator className="w-8 h-8 text-emerald-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black font-display text-foreground">Calculating your BMI...</h3>
                  <p className="text-muted-foreground mt-2">Generating a personalised wellness report</p>
                </motion.div>
              )}

              {data && !isPending && bmiRange && (
                <motion.div key="results" variants={stagger} initial="hidden" animate="show" className="space-y-5">

                  {/* Hero score card */}
                  <motion.div variants={fadeUp} className={`rounded-3xl border-2 bg-gradient-to-br ${bmiRange.bg} ${bmiRange.dark} p-6`}>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="shrink-0 flex flex-col items-center w-full sm:w-auto">
                        <BmiGauge bmi={data.bmi} color={bmiRange.color} />
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring" }}
                          className={`mt-2 px-5 py-2 rounded-full font-black text-sm ${bmiRange.text} bg-white/70 dark:bg-white/10`}>
                          {bmiRange.label} · {bmiRange.desc}
                        </motion.div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider mb-1">Your BMI Score</p>
                          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
                            className={`text-7xl font-black font-display ${bmiRange.text} leading-none`}>
                            {data.bmi}
                          </motion.div>
                        </div>
                        <p className="text-slate-700 dark:text-muted-foreground leading-relaxed">{data.advice}</p>
                        {weightDiff && idealWeight && (
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${Number(weightDiff) > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" : Number(weightDiff) < 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"}`}>
                            <Target className="w-4 h-4" />
                            {Number(weightDiff) > 0 ? `${weightDiff} kg above ideal weight` : Number(weightDiff) < 0 ? `${Math.abs(Number(weightDiff))} kg below ideal weight` : "You're at your ideal weight!"}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Metrics row */}
                  <motion.div variants={fadeUp} custom={1} className="grid grid-cols-3 gap-4">
                    {[
                      { label: "BMI", value: data.bmi.toString(), icon: Activity, color: bmiRange.text },
                      { label: "Category", value: bmiRange.label, icon: Scale, color: bmiRange.text },
                      { label: "Ideal Weight", value: idealWeight ? `~${idealWeight.toFixed(0)} kg` : "—", icon: Target, color: "text-violet-500 dark:text-violet-400" },
                    ].map((m, i) => (
                      <div key={i} className="bg-white dark:bg-card rounded-2xl border border-border/60 p-4 text-center shadow-sm">
                        <m.icon className={`w-5 h-5 ${m.color} mx-auto mb-2`} />
                        <p className={`font-black text-lg ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-slate-400 dark:text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* Diet & Exercise */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <motion.div variants={fadeUp} custom={2} className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-5 border-b border-emerald-100 dark:border-emerald-900/30">
                        <h3 className="font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                          <Apple className="w-5 h-5 text-emerald-500" /> Dietary Focus
                        </h3>
                      </div>
                      <div className="p-5 space-y-2.5">
                        {data.dietTips.map((tip, i) => (
                          <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ x: 4 }}
                            className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-muted-foreground bg-slate-50 dark:bg-muted/20 rounded-xl p-2.5">
                            <ChevronRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {tip}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={fadeUp} custom={3} className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 border-b border-indigo-100 dark:border-indigo-900/30">
                        <h3 className="font-bold flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
                          <Dumbbell className="w-5 h-5 text-indigo-500" /> Activity Plan
                        </h3>
                      </div>
                      <div className="p-5 space-y-2.5">
                        {data.exerciseTips.map((tip, i) => (
                          <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ x: 4 }}
                            className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-muted-foreground bg-slate-50 dark:bg-muted/20 rounded-xl p-2.5">
                            <ChevronRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> {tip}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Progress bars for BMI zones */}
                  <motion.div variants={fadeUp} custom={4} className="bg-white dark:bg-card rounded-3xl border border-border/60 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-foreground mb-4 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-slate-500" /> BMI Zone Overview
                    </h3>
                    <div className="space-y-3">
                      {BMI_RANGES.map(r => {
                        const isCurrent = data.bmi >= r.min && data.bmi < r.max;
                        return (
                          <div key={r.label} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isCurrent ? "bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border" : ""}`}>
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ background: r.color }} />
                            <span className={`text-sm font-semibold w-24 shrink-0 ${isCurrent ? "text-slate-800 dark:text-foreground" : "text-slate-400 dark:text-muted-foreground"}`}>{r.label}</span>
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${r.bar}`} style={{ width: isCurrent ? `${Math.min(((data.bmi - r.min) / (r.max - r.min)) * 100, 100)}%` : "0%" }} />
                            </div>
                            <span className="text-xs text-slate-400 font-mono w-16 text-right shrink-0">{r.min}–{r.max === 100 ? "30+" : r.max}</span>
                            {isCurrent && <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full shrink-0" style={{ background: r.color }}>You</span>}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Health note */}
                  <motion.div variants={fadeUp} custom={5} className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-5 flex gap-4">
                    <Heart className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                      <strong>Important:</strong> BMI is a screening tool, not a definitive health measure. Factors like muscle mass, bone density, age, and ethnicity affect what a healthy BMI looks like for you. Always consult a healthcare professional for a complete assessment.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
