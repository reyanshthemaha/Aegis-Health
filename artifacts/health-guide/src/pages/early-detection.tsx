import { useState, useRef } from "react";
import {
  ShieldAlert, HeartPulse, Eye, Brain, AlertCircle, ArrowRight,
  CheckCircle2, XCircle, Clock, Stethoscope, Activity, Dna,
  Microscope, Wind, Bone, Zap, ChevronDown, ChevronUp, Search, Star
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence, useInView } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as any } }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function InView({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

const CATEGORIES = [
  {
    icon: HeartPulse, color: "from-rose-400 to-pink-500", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-100 dark:border-rose-900/30", text: "text-rose-800 dark:text-rose-300",
    title: "Cardiovascular", tag: "Heart & Blood Vessels",
    desc: "Heart disease often develops silently. Spotting early signs saves lives.",
    warnings: ["Unexplained shortness of breath during light activity", "Persistent chest discomfort or pressure", "Swelling in legs, ankles, or feet", "Irregular or rapid heartbeat", "Excessive fatigue after minimal exertion"],
    screenings: ["Blood pressure check (every year)", "Cholesterol panel (every 5 years)", "EKG baseline (over 40)", "Stress test if symptomatic"],
    riskFactors: ["High blood pressure", "Smoking", "Obesity", "Family history", "Diabetes", "High cholesterol"],
  },
  {
    icon: Brain, color: "from-violet-400 to-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-100 dark:border-purple-900/30", text: "text-purple-800 dark:text-purple-300",
    title: "Neurological", tag: "Brain & Nervous System",
    desc: "Early neurological intervention is critical for long-term function.",
    warnings: ["Sudden severe headaches with no known cause", "Unexplained confusion or difficulty speaking", "Numbness or weakness on one side of the body", "Noticeable changes in balance or coordination", "Sudden vision changes in one or both eyes"],
    screenings: ["Cognitive screening (over 65)", "Blood pressure monitoring (prevents stroke)", "MRI if symptoms present", "Cholesterol management"],
    riskFactors: ["High blood pressure", "Smoking", "Family history", "Head trauma history", "Sleep apnea", "Diabetes"],
  },
  {
    icon: Eye, color: "from-amber-400 to-orange-500", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-900/30", text: "text-amber-800 dark:text-amber-300",
    title: "Metabolic & Endocrine", tag: "Diabetes, Thyroid & More",
    desc: "Conditions like diabetes affect every organ. Early metabolic screening matters.",
    warnings: ["Unusual thirst and frequent urination", "Unexplained weight changes (loss or gain)", "Chronic fatigue despite adequate sleep", "Slow-healing cuts or frequent infections", "Tingling or numbness in extremities"],
    screenings: ["Fasting blood glucose (annually if at risk)", "HbA1c test (every 3 years)", "Thyroid TSH panel", "Insulin resistance markers"],
    riskFactors: ["Obesity", "Sedentary lifestyle", "Family history", "Age over 45", "PCOS (women)", "Previous gestational diabetes"],
  },
  {
    icon: Wind, color: "from-blue-400 to-sky-500", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-900/30", text: "text-blue-800 dark:text-blue-300",
    title: "Respiratory", tag: "Lungs & Airways",
    desc: "Lung conditions often go undetected until advanced. Breathe easier with early checks.",
    warnings: ["Persistent cough lasting more than 3 weeks", "Coughing up blood or rust-colored sputum", "Chest pain that worsens with breathing", "Unexplained weight loss with breathing issues", "Wheezing or new onset of asthma in adults"],
    screenings: ["Lung function test (spirometry)", "Low-dose CT scan (smokers over 50)", "Chest X-ray if symptomatic", "Pulse oximetry baseline"],
    riskFactors: ["Smoking or secondhand smoke", "Air pollution exposure", "Occupational hazards (asbestos, dust)", "Family history of lung disease", "Frequent respiratory infections"],
  },
  {
    icon: Dna, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-900/30", text: "text-emerald-800 dark:text-emerald-300",
    title: "Cancer Prevention", tag: "Early Detection Saves Lives",
    desc: "Cancer caught early has a dramatically higher survival rate. Know the signs.",
    warnings: ["Unexplained lumps or growths anywhere on the body", "Persistent changes in bowel or bladder habits", "Unusual bleeding or discharge", "Non-healing sores or skin changes", "Unexplained significant weight loss"],
    screenings: ["Mammogram (women 40+, annually)", "Colonoscopy (50+, every 10 years)", "PSA test (men 50+)", "Pap smear (women 21+, every 3 years)", "Skin dermatology annual check"],
    riskFactors: ["Family history of cancer", "Smoking or alcohol", "Obesity", "Prolonged UV exposure", "Certain viral infections (HPV, Hepatitis B/C)"],
  },
  {
    icon: Bone, color: "from-teal-400 to-cyan-500", bg: "bg-teal-50 dark:bg-teal-900/20", border: "border-teal-100 dark:border-teal-900/30", text: "text-teal-800 dark:text-teal-300",
    title: "Musculoskeletal", tag: "Bones, Joints & Muscles",
    desc: "Arthritis and bone loss start silently. Keep moving with early detection.",
    warnings: ["Morning stiffness lasting more than 30 minutes", "Joint swelling, warmth, or redness", "Unexplained bone pain or tenderness", "Frequent muscle weakness or cramps", "Reduced grip strength or mobility"],
    screenings: ["DEXA bone density scan (women 65+)", "Vitamin D and calcium levels", "Joint X-ray if persistent pain", "Rheumatoid factor blood test"],
    riskFactors: ["Family history of arthritis", "Menopause (women)", "Low calcium intake", "Sedentary lifestyle", "Previous bone fractures", "Autoimmune conditions"],
  },
];

const SELF_QUIZ = [
  { q: "Do you experience unexplained fatigue even after a full night's sleep?", risk: "metabolic" },
  { q: "Have you noticed unusual changes in your heart rhythm or palpitations?", risk: "cardiovascular" },
  { q: "Do you experience persistent headaches or memory lapses?", risk: "neurological" },
  { q: "Have you had recent unexplained weight changes?", risk: "metabolic" },
  { q: "Do you have a family history of chronic disease?", risk: "general" },
  { q: "Do you smoke or are frequently exposed to secondhand smoke?", risk: "respiratory" },
  { q: "Do you experience joint pain or stiffness regularly?", risk: "musculoskeletal" },
];

export default function EarlyDetection() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, "yes" | "no" | null>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filters = ["All", "Cardiovascular", "Neurological", "Metabolic & Endocrine", "Respiratory", "Cancer Prevention", "Musculoskeletal"];

  const filtered = CATEGORIES.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.tag.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "All" || c.title === activeFilter;
    return matchSearch && matchFilter;
  });

  const riskCount = Object.values(quizAnswers).filter(v => v === "yes").length;
  const riskLevel = riskCount <= 1 ? "low" : riskCount <= 3 ? "moderate" : "high";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 py-20 px-6 relative overflow-hidden">
        {[
          { w: "w-64 h-64", pos: "left-[-5%] top-[-10%]", color: "bg-violet-500/20", dur: 8 },
          { w: "w-80 h-80", pos: "right-[-5%] bottom-[-15%]", color: "bg-rose-500/15", dur: 11 },
          { w: "w-40 h-40", pos: "left-[40%] top-[30%]", color: "bg-blue-500/10", dur: 7 },
        ].map((o, i) => (
          <motion.div key={i} className={`absolute rounded-full blur-3xl ${o.w} ${o.pos} ${o.color}`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: o.dur }} />
        ))}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1400px] mx-auto text-center relative z-10">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}
            className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-5 shadow-lg">
            <ShieldAlert className="w-8 h-8 text-violet-300" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black font-display text-white mb-4">Early Detection Guide</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Knowing the warning signs is the first step in prevention. Understand what your body is telling you.
          </p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conditions, e.g. heart, cancer, diabetes..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 text-sm"
            />
          </div>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-16">

        {/* Stats strip */}
        <InView className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {[
            { icon: CheckCircle2, label: "Conditions Covered", val: "6+", color: "text-emerald-500" },
            { icon: Stethoscope, label: "Screening Tests Listed", val: "20+", color: "text-blue-500" },
            { icon: Activity, label: "Warning Signs", val: "30+", color: "text-orange-500" },
            { icon: Star, label: "Risk Factors Tracked", val: "25+", color: "text-violet-500" },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-sm p-4 text-center">
              <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
              <p className={`text-2xl font-black font-display ${s.color}`}>{s.val}</p>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </InView>

        {/* Self-assessment quiz */}
        <InView className="mb-14">
          <motion.div variants={fadeUp} className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-6 border-b border-violet-100 dark:border-violet-900/30">
              <h2 className="text-xl font-black text-slate-800 dark:text-foreground flex items-center gap-2">
                <Microscope className="w-5 h-5 text-violet-500" /> Quick Risk Self-Assessment
              </h2>
              <p className="text-sm text-slate-500 mt-1">Answer 7 questions to understand your personal risk profile.</p>
            </div>
            <div className="p-6 space-y-4">
              {SELF_QUIZ.map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-muted/20 border border-border/40">
                  <p className="text-sm font-medium text-slate-700 dark:text-foreground flex-1">{i + 1}. {item.q}</p>
                  <div className="flex gap-2 shrink-0">
                    {(["yes", "no"] as const).map(ans => (
                      <motion.button key={ans} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setQuizAnswers(p => ({ ...p, [i]: ans }))}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          quizAnswers[i] === ans
                            ? ans === "yes" ? "bg-rose-500 border-rose-500 text-white" : "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-200 dark:border-border text-slate-500 hover:border-slate-300"
                        }`}>
                        {ans.charAt(0).toUpperCase() + ans.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setQuizDone(true)}
                disabled={Object.keys(quizAnswers).length < SELF_QUIZ.length}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-sm shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" /> Get My Risk Assessment
              </motion.button>

              <AnimatePresence>
                {quizDone && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className={`p-5 rounded-2xl border-2 mt-2 ${
                      riskLevel === "low" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/30"
                      : riskLevel === "moderate" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30"
                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30"
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`text-3xl font-black font-display ${riskLevel === "low" ? "text-emerald-600" : riskLevel === "moderate" ? "text-amber-600" : "text-red-600"}`}>
                          {riskLevel === "low" ? "🟢" : riskLevel === "moderate" ? "🟡" : "🔴"}
                        </div>
                        <div>
                          <p className={`font-black text-lg capitalize ${riskLevel === "low" ? "text-emerald-800" : riskLevel === "moderate" ? "text-amber-800" : "text-red-800"}`}>
                            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk Profile
                          </p>
                          <p className={`text-sm mt-1 ${riskLevel === "low" ? "text-emerald-700" : riskLevel === "moderate" ? "text-amber-700" : "text-red-700"}`}>
                            {riskLevel === "low" ? "Great! Your responses suggest low immediate risk. Stay consistent with annual checkups."
                              : riskLevel === "moderate" ? "Some risk factors detected. Consider scheduling a health checkup soon and reviewing your lifestyle."
                              : "Multiple risk factors identified. We strongly recommend consulting a doctor for a full health screening."}
                          </p>
                          <Link href="/symptoms">
                            <motion.span whileHover={{ x: 4 }} className="text-xs font-bold text-violet-600 flex items-center gap-1 mt-2 cursor-pointer">
                              Check your symptoms in detail <ArrowRight className="w-3 h-3" />
                            </motion.span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </InView>

        {/* Category filter */}
        <InView className="mb-8">
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
            {filters.map(f => (
              <motion.button key={f} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setActiveFilter(f)}
                className={`text-xs px-3.5 py-2 rounded-full font-semibold border-2 transition-all ${
                  activeFilter === f
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:border-slate-400 dark:hover:border-slate-500"
                }`}>
                {f}
              </motion.button>
            ))}
          </motion.div>
        </InView>

        {/* Category cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((cat, i) => {
            const CatIcon = cat.icon;
            const isOpen = expanded === i;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 2) * 0.1 }}
                className={`${cat.bg} border-2 ${cat.border} rounded-3xl overflow-hidden shadow-sm`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full p-6 flex items-start gap-4 text-left"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0 shadow-md`}>
                    <CatIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{cat.tag}</p>
                    <h3 className={`font-black text-xl ${cat.text}`}>{cat.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1 line-clamp-2">{cat.desc}</p>
                  </div>
                  <div className={`shrink-0 mt-1 ${cat.text}`}>
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Warning signs (always visible) */}
                <div className="px-6 pb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">⚠ Warning Signs</p>
                  <ul className="space-y-1.5">
                    {cat.warnings.slice(0, isOpen ? cat.warnings.length : 3).map((w, j) => (
                      <motion.li key={j} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: j * 0.06 }}
                        className={`flex items-start gap-2 text-sm ${cat.text}`}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {w}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Expanded: Screenings + Risk Factors */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-6 pb-6 grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/40">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" /> Recommended Screenings
                          </p>
                          {cat.screenings.map((s, j) => (
                            <div key={j} className={`flex items-start gap-2 text-sm ${cat.text} mb-1.5`}>
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {s}
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Risk Factors
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.riskFactors.map((r, j) => (
                              <span key={j} className={`text-xs px-2.5 py-1 rounded-full bg-white/60 border border-white/40 ${cat.text} font-medium`}>{r}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <InView className="mt-14">
          <motion.div variants={fadeUp} className="bg-gradient-to-br from-slate-900 to-violet-950 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="text-4xl mb-4">🩺</motion.div>
            <h2 className="text-3xl font-black text-white font-display mb-3">Think you have symptoms?</h2>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">Use the Symptom Checker to get a more personalized assessment with urgency levels and next steps.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/symptoms">
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-lg cursor-pointer hover:bg-violet-50 transition-colors">
                  <Activity className="w-4 h-4" /> Check Symptoms
                </motion.span>
              </Link>
              <Link href="/">
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm cursor-pointer hover:bg-white/20 transition-colors">
                  <Search className="w-4 h-4" /> Search a Disease
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </InView>
      </div>
    </div>
  );
}
