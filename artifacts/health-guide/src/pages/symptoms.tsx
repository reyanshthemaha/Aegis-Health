import { useState, useRef } from "react";
import { useCheckSymptoms } from "@workspace/api-client-react";
import {
  Activity, Plus, X, AlertTriangle, Zap, ShieldAlert, ArrowRight,
  Loader2, Sparkles, Clock, CheckCircle2, ChevronRight, Search, Thermometer,
  Heart, Brain, Wind, Bone, Eye, Droplets
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as any } }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const SYMPTOM_CATEGORIES = [
  { label: "Head & Brain", icon: Brain, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", symptoms: ["Headache", "Dizziness", "Memory lapses", "Confusion", "Fainting"] },
  { label: "Heart & Chest", icon: Heart, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300", symptoms: ["Chest Pain", "Heart Palpitations", "Shortness of Breath", "Swollen Feet", "Fast heartbeat"] },
  { label: "Digestive", icon: Droplets, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", symptoms: ["Stomach Ache", "Nausea", "Vomiting", "Diarrhea", "Bloating", "Acid reflux"] },
  { label: "General", icon: Thermometer, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", symptoms: ["Fever", "Fatigue", "Chills", "Night sweats", "Weight loss", "Loss of appetite"] },
  { label: "Respiratory", icon: Wind, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", symptoms: ["Cough", "Wheezing", "Runny nose", "Sore Throat", "Congestion"] },
  { label: "Musculoskeletal", icon: Bone, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", symptoms: ["Back Pain", "Joint Pain", "Muscle aches", "Stiffness", "Swollen joints"] },
  { label: "Skin & Eyes", icon: Eye, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300", symptoms: ["Skin Rash", "Blurred Vision", "Itching", "Yellowing skin", "Eye redness"] },
  { label: "Mental", icon: Brain, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", symptoms: ["Anxiety", "Insomnia", "Depression", "Mood swings", "Irritability"] },
];

const urgencyConfig = {
  low:       { bg: "from-emerald-50 to-teal-50 border-emerald-200",   dark: "dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-900/40", text: "text-emerald-800 dark:text-emerald-300", badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Low Urgency",      msg: "Monitor symptoms. If they persist or worsen, consult a doctor." },
  medium:    { bg: "from-amber-50 to-orange-50 border-amber-200",     dark: "dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-900/40",   text: "text-amber-800 dark:text-amber-300",   badge: "bg-amber-100 text-amber-700",   icon: Clock,        label: "Moderate Urgency", msg: "See a doctor soon to get a professional diagnosis and rule out serious conditions." },
  high:      { bg: "from-orange-50 to-red-50 border-orange-200",     dark: "dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-900/40",     text: "text-orange-800 dark:text-orange-300", badge: "bg-orange-100 text-orange-700", icon: AlertTriangle, label: "High Urgency",     msg: "Please seek medical attention promptly — do not delay further." },
  emergency: { bg: "from-red-50 to-rose-50 border-red-300",          dark: "dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-900/40",          text: "text-red-800 dark:text-red-300",       badge: "bg-red-100 text-red-700",       icon: Zap,          label: "EMERGENCY",        msg: "Seek IMMEDIATE medical attention or call emergency services NOW." },
};

const probConfig = {
  high:     { bar: "bg-red-500",    w: 85, label: "High", cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" },
  moderate: { bar: "bg-amber-500",  w: 55, label: "Moderate", cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30" },
  low:      { bar: "bg-slate-400",  w: 28, label: "Low", cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-muted dark:text-muted-foreground dark:border-border" },
};

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const checkSymptoms = useCheckSymptoms();
  const { data, isPending } = checkSymptoms;
  const inputRef = useRef<HTMLInputElement>(null);

  const addSymptom = (s: string) => {
    const t = s.trim();
    if (t && !symptoms.includes(t)) setSymptoms(p => [...p, t]);
    setCurrentInput("");
    inputRef.current?.focus();
  };

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (currentInput.trim()) addSymptom(currentInput);
  };

  const remove = (s: string) => setSymptoms(p => p.filter(x => x !== s));
  const clear = () => { setSymptoms([]); checkSymptoms.reset(); };

  const analyze = () => {
    if (!symptoms.length) return;
    checkSymptoms.mutate({ data: { symptoms, additionalInfo: additionalInfo.trim() || undefined } });
  };

  const cat = SYMPTOM_CATEGORIES[activeCategory];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 py-16 px-4 relative overflow-hidden">
        {[
          { pos: "-left-20 -top-20", size: "w-72 h-72", dur: 8 },
          { pos: "right-0 bottom-0", size: "w-80 h-80", dur: 10 },
          { pos: "left-1/2 top-1/3", size: "w-40 h-40", dur: 6 },
        ].map((o, i) => (
          <motion.div key={i} className={`absolute ${o.pos} ${o.size} rounded-full bg-white/10 blur-3xl`}
            animate={{ scale: [1, 1.3, 1], x: [0, 20, 0], y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: o.dur, ease: "easeInOut" }} />
        ))}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1400px] mx-auto text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Thermometer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display text-white mb-3">Symptom Checker</h1>
          <p className="text-xl text-white/80 max-w-xl mx-auto">Add your symptoms and get a detailed assessment of possible conditions with urgency levels and next steps.</p>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="grid xl:grid-cols-5 gap-8">

          {/* ── Left: Input panel ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Type & add */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border/40">
                <h2 className="font-bold text-slate-800 dark:text-foreground flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-blue-500" /> What are you experiencing?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Be specific — e.g. "sharp pain in lower back for 3 days"</p>
              </div>
              <div className="p-5 space-y-4">
                <form onSubmit={handleAdd} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentInput}
                      onChange={e => setCurrentInput(e.target.value)}
                      placeholder="Type a symptom..."
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition"
                    />
                  </div>
                  <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0">
                    <Plus className="w-4 h-4" /> Add
                  </motion.button>
                </form>

                {/* Added tags */}
                <div className={`min-h-[80px] p-3 rounded-2xl border-2 border-dashed transition-colors ${symptoms.length ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10" : "border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20"}`}>
                  <AnimatePresence>
                    {symptoms.length === 0 ? (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-400 text-xs py-5">
                        No symptoms added yet — type above or pick from categories below
                      </motion.p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {symptoms.map(s => (
                          <motion.span key={s}
                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                            {s}
                            <button onClick={() => remove(s)} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Additional info */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Additional Context (Optional)</label>
                  <textarea
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder="How long have you had these? Any recent travel, diet changes, medication?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 resize-none transition"
                  />
                </div>

                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={analyze}
                    disabled={!symptoms.length || isPending}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-sm shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                    {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                      : <><Sparkles className="w-4 h-4" /> Analyze {symptoms.length > 0 ? `(${symptoms.length})` : "Symptoms"}</>}
                  </motion.button>
                  {symptoms.length > 0 && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={clear}
                      className="px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-border text-slate-500 hover:bg-slate-50 dark:hover:bg-muted text-sm font-medium transition-colors">
                      Clear
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Category picker */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 dark:text-foreground text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" /> Pick by Category
              </h3>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {SYMPTOM_CATEGORIES.map((c, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveCategory(i)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-all ${activeCategory === i ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900" : "border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground hover:border-slate-400"}`}>
                    {c.label}
                  </motion.button>
                ))}
              </div>
              {/* Active category symptoms */}
              <AnimatePresence mode="wait">
                <motion.div key={activeCategory}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex flex-wrap gap-1.5">
                  {cat.symptoms.filter(s => !symptoms.includes(s)).map(s => (
                    <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => addSymptom(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${cat.color} border-transparent hover:shadow-sm`}>
                      + {s}
                    </motion.button>
                  ))}
                  {cat.symptoms.every(s => symptoms.includes(s)) && (
                    <p className="text-xs text-slate-400 italic">All symptoms from this category added</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Body location hint */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-5">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Tips for accurate results
              </h3>
              <ul className="space-y-1.5 text-xs text-blue-700 dark:text-blue-400">
                {["Be specific — 'sharp chest pain' is better than 'chest hurts'", "Add duration — 'headache for 3 days'", "Include multiple related symptoms for better accuracy", "Use the context box for recent travel, diet, or medication changes"].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />{tip}</li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* ── Right: Results ── */}
          <div className="xl:col-span-3">
            <AnimatePresence mode="wait">
              {!data && !isPending && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center bg-white/70 dark:bg-card/70 rounded-3xl border-2 border-dashed border-slate-200 dark:border-border">
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                    <ShieldAlert className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-black font-display text-slate-600 dark:text-foreground mb-2">Awaiting Your Symptoms</h3>
                  <p className="text-slate-400 dark:text-muted-foreground max-w-sm">Add at least one symptom from the panel on the left, then click Analyze for a detailed assessment.</p>
                  <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs w-full">
                    {["Headache", "Fever", "Fatigue", "Chest Pain"].map(s => (
                      <motion.button key={s} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => addSymptom(s)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-border text-xs font-medium text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted transition-colors">
                        + {s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {isPending && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm">
                  <div className="relative w-24 h-24 mb-8">
                    <motion.div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
                    <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
                    <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-b-violet-400" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
                    <motion.div className="absolute inset-3 rounded-full border-4 border-transparent border-t-rose-300/60" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Activity className="w-8 h-8 text-blue-500" />
                      </motion.div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black font-display text-foreground mb-2">Analyzing {symptoms.length} Symptom{symptoms.length > 1 ? "s" : ""}...</h3>
                  <p className="text-muted-foreground mb-6">Cross-referencing with medical databases and literature</p>
                  <div className="flex gap-1.5">
                    {[0,1,2,3].map(i => <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-blue-400" animate={{ y:[0,-10,0], opacity:[0.5,1,0.5] }} transition={{ repeat: Infinity, duration: 0.8, delay: i*0.15 }} />)}
                  </div>
                </motion.div>
              )}

              {data && !isPending && (
                <motion.div key="results" variants={stagger} initial="hidden" animate="show" className="space-y-5">
                  {/* Urgency banner */}
                  {(() => {
                    const u = urgencyConfig[data.urgencyLevel as keyof typeof urgencyConfig] ?? urgencyConfig.medium;
                    const UIcon = u.icon;
                    return (
                      <motion.div variants={fadeUp} className={`p-6 rounded-3xl border-2 bg-gradient-to-r ${u.bg} ${u.dark}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white/60 dark:bg-white/10 flex items-center justify-center shrink-0">
                            <UIcon className={`w-7 h-7 ${u.text}`} />
                          </div>
                          <div className="flex-1">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${u.badge}`}>{u.label}</span>
                            <p className={`${u.text} leading-relaxed`}>{u.msg}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  <motion.div variants={fadeUp} className="flex items-center justify-between">
                    <h3 className="font-black font-display text-2xl text-slate-800 dark:text-foreground">
                      {data.possibleConditions.length} Possible Condition{data.possibleConditions.length > 1 ? "s" : ""}
                    </h3>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={clear}
                      className="text-xs px-4 py-2 rounded-full border border-slate-200 dark:border-border text-slate-500 hover:bg-slate-50 dark:hover:bg-muted transition-colors font-medium">
                      New Analysis
                    </motion.button>
                  </motion.div>

                  {data.possibleConditions.map((c, i) => {
                    const p = probConfig[c.probability as keyof typeof probConfig] ?? probConfig.low;
                    return (
                      <motion.div key={i} variants={fadeUp} custom={i}
                        whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
                        className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden transition-all">
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <h4 className="font-black text-xl text-slate-800 dark:text-foreground">{c.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-muted rounded-full overflow-hidden w-32">
                                  <motion.div className={`h-full rounded-full ${p.bar}`} initial={{ width: 0 }} animate={{ width: `${p.w}%` }} transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }} />
                                </div>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${p.cls}`}>{p.label} Match</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-muted-foreground mb-4 leading-relaxed">{c.description}</p>
                          <div className="bg-slate-50 dark:bg-muted/30 rounded-2xl p-4 mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <ChevronRight className="w-3.5 h-3.5 text-blue-500" /> Recommended Next Steps
                            </p>
                            <ul className="space-y-1.5">
                              {c.nextSteps.map((step, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Link href={`/disease/${encodeURIComponent(c.name)}`}>
                            <motion.span whileHover={{ x: 4 }} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
                              View full analysis <ArrowRight className="w-4 h-4" />
                            </motion.span>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Recommendations */}
                  <motion.div variants={fadeUp} className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-6">
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2 text-lg">
                      <Activity className="w-5 h-5" /> General Recommendations
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {data.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-blue-800 dark:text-blue-300 bg-white/60 dark:bg-blue-900/20 rounded-xl p-3">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" /> {r}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <p className="text-xs text-slate-400 text-center pb-4">{data.disclaimer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
