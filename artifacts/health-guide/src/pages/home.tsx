import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Search, Activity, Scale, ShieldAlert, Apple,
  Heart, Pill, Eye, Star, Upload, ArrowRight,
  CheckCircle2, Clock, Zap, Shield, Stethoscope, Brain,
  Sparkles, TrendingUp, Thermometer,
  Droplets, Dna, Microscope, BookOpen, RefreshCw,
  ChevronLeft, ChevronRight, Info, Users, BarChart2, Award
} from "lucide-react";
import { useGetPopularDiseases, getGetPopularDiseasesQueryKey } from "@workspace/api-client-react";

/* ── Animation presets ── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as any }
  }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/* ── Count-up ── */
function useCountUp(target: number, inView: boolean, duration = 1.8) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const totalFrames = Math.round(duration * 60);
    const timer = setInterval(() => {
      frame++;
      setCount(Math.floor(target * (frame / totalFrames)));
      if (frame === totalFrames) clearInterval(timer);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return count;
}

function StatNumber({ value, suffix = "", color }: { value: number; suffix?: string; color: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const n = useCountUp(value, inView);
  return <span ref={ref} className={`text-5xl font-black font-display ${color}`}>{n}{suffix}</span>;
}

/* ── Health tips ── */
const HEALTH_TIPS = [
  { icon: Droplets, tip: "Drink 8+ glasses of water daily to support kidney function and skin health.", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/40" },
  { icon: Activity, tip: "30 minutes of moderate exercise 5 days a week reduces heart disease risk by 35%.", color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/40" },
  { icon: Apple, tip: "Eating 5 servings of fruits and vegetables daily can reduce cancer risk by up to 20%.", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/40" },
  { icon: Clock, tip: "Adults need 7–9 hours of sleep for immune function and mental clarity.", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/40" },
  { icon: Shield, tip: "Annual checkups catch 80% of preventable conditions before they become serious.", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/40" },
  { icon: Brain, tip: "10 minutes of daily meditation lowers cortisol and reduces anxiety symptoms.", color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/40" },
];

/* ── Rotating health stats ── */
const HEALTH_STATS = [
  { label: "Conditions Covered", value: "500+", icon: BarChart2, color: "from-violet-500 to-purple-600" },
  { label: "Happy Users", value: "10K+", icon: Users, color: "from-rose-500 to-pink-600" },
  { label: "Accuracy Rate", value: "98%", icon: Award, color: "from-emerald-500 to-teal-600" },
  { label: "Response Time", value: "<2s", icon: Zap, color: "from-amber-500 to-orange-600" },
];

/* ── Popular disease categories ── */
const DISEASE_CATEGORIES = [
  { name: "Cardiovascular", icon: Heart, color: "bg-rose-500", diseases: ["Hypertension", "Heart Attack", "Arrhythmia"] },
  { name: "Metabolic", icon: Activity, color: "bg-amber-500", diseases: ["Diabetes", "Thyroid", "Obesity"] },
  { name: "Neurological", icon: Brain, color: "bg-violet-500", diseases: ["Migraine", "Epilepsy", "Anxiety"] },
  { name: "Respiratory", icon: Thermometer, color: "bg-blue-500", diseases: ["Asthma", "Pneumonia", "COPD"] },
  { name: "Genetic", icon: Dna, color: "bg-emerald-500", diseases: ["Hemophilia", "Thalassemia", "PKU"] },
  { name: "Skin & Eye", icon: Eye, color: "bg-pink-500", diseases: ["Psoriasis", "Eczema", "Glaucoma"] },
];

/* ── Floating background orbs ── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { cx: "5%", cy: "25%", color: "bg-violet-400/20", size: "w-[600px] h-[600px]", dur: 12, dx: 60, dy: -40 },
        { cx: "80%", cy: "60%", color: "bg-rose-400/15", size: "w-[500px] h-[500px]", dur: 15, dx: -70, dy: 50 },
        { cx: "50%", cy: "90%", color: "bg-blue-400/15", size: "w-[400px] h-[400px]", dur: 10, dx: 40, dy: -60 },
        { cx: "90%", cy: "10%", color: "bg-orange-300/15", size: "w-[350px] h-[350px]", dur: 13, dx: -40, dy: 40 },
      ].map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${o.color} ${o.size}`}
          style={{ left: o.cx, top: o.cy, translateX: "-50%", translateY: "-50%" }}
          animate={{ x: [0, o.dx, 0], y: [0, o.dy, 0] }}
          transition={{ repeat: Infinity, duration: o.dur, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Main ── */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const [dragOver, setDragOver] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [statIndex, setStatIndex] = useState(0);
  const [catIndex, setCatIndex] = useState(0);
  const [recentDiseases, setRecentDiseases] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const heroRef = useRef(null);

  const { data: popularDiseases } = useGetPopularDiseases({
    query: { queryKey: getGetPopularDiseasesQueryKey() },
  });

  useEffect(() => {
    try { setRecentDiseases(JSON.parse(localStorage.getItem("aegis_recent") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    const t1 = setInterval(() => setTipIndex(i => (i + 1) % HEALTH_TIPS.length), 4500);
    const t2 = setInterval(() => setStatIndex(i => (i + 1) % HEALTH_STATS.length), 3000);
    const t3 = setInterval(() => setCatIndex(i => (i + 1) % DISEASE_CATEGORIES.length), 2500);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const navigate = useCallback((name: string) => {
    try {
      const recent: string[] = JSON.parse(localStorage.getItem("aegis_recent") || "[]");
      const updated = [name, ...recent.filter(r => r !== name)].slice(0, 6);
      localStorage.setItem("aegis_recent", JSON.stringify(updated));
      setRecentDiseases(updated);
    } catch {}
    setLocation(`/disease/${encodeURIComponent(name)}`);
  }, [setLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(searchQuery.trim());
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });

  const convertPdfToImages = async (file: File): Promise<string[]> => {
    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
    if (!GlobalWorkerOptions.workerSrc) {
      const pdfjsLib = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
    const buf = await file.arrayBuffer();
    const pdf = await getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
      pages.push(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    }
    return pages;
  };

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setIsProcessingFiles(true);
    try {
      const imagesBase64: string[] = [];
      for (const file of fileArr) {
        if (file.type === "application/pdf") {
          const pages = await convertPdfToImages(file);
          imagesBase64.push(...pages);
        } else if (file.type.startsWith("image/")) {
          imagesBase64.push(await fileToBase64(file));
        }
      }
      if (imagesBase64.length > 0) {
        try { sessionStorage.setItem("aegis_upload_images", JSON.stringify(imagesBase64)); } catch {}
      }
      const firstName = fileArr[0].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      navigate(firstName || "Medical Image Analysis");
    } finally {
      setIsProcessingFiles(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const suggestions = searchQuery.length > 1
    ? (popularDiseases || []).filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const tip = HEALTH_TIPS[tipIndex];
  const stat = HEALTH_STATS[statIndex];
  const cat = DISEASE_CATEGORIES[catIndex];

  return (
    <div className="w-full bg-slate-50 dark:bg-background">

      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900">
        <FloatingOrbs />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: text + search */}
            <motion.div variants={stagger} initial="hidden" animate="show">

              <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                  <motion.span animate={{ rotate: [0, 20, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  </motion.span>
                  Your Personal Health Companion · By Reyansh Mahajan
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-6xl lg:text-7xl font-black font-display text-white leading-[1.02] tracking-tight mb-6">
                Your{" "}
                <motion.span
                  className="bg-gradient-to-r from-violet-400 via-pink-400 to-rose-400 bg-clip-text text-transparent"
                  animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                >
                  health,
                </motion.span>
                <br />
                explained.
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-white/70 text-xl leading-relaxed mb-8 max-w-lg">
                Search any disease, upload a photo, or describe your symptoms. Get a full medical breakdown — causes, diet, medicines, and treatment — instantly.
              </motion.p>

              {/* Search */}
              <motion.div variants={fadeUp} custom={3} className="relative mb-5">
                <form onSubmit={handleSearch}>
                  <div className="relative flex items-center">
                    <Search className="absolute left-5 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search any disease, e.g. Diabetes, Asthma..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                      className="w-full pl-13 pr-36 py-5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur text-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:bg-white/15 transition-all shadow-xl"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="absolute right-2 h-11 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                    >
                      Analyze
                    </motion.button>
                  </div>
                </form>

                {/* Suggestions */}
                <AnimatePresence>
                  {searchFocused && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-card rounded-2xl border border-border shadow-2xl z-50 overflow-hidden"
                    >
                      {suggestions.map((s) => (
                        <button
                          key={s.name}
                          onClick={() => navigate(s.name)}
                          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-muted text-sm text-left transition-colors border-b border-slate-100 dark:border-border last:border-0"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-foreground">{s.name}</span>
                          <span className="ml-auto text-xs text-slate-400 bg-slate-100 dark:bg-muted px-2 py-0.5 rounded-full">{s.category}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── Upload row (always visible on all screens) ── */}
              <motion.div variants={fadeUp} custom={3.5} className="mb-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileSelect(e.target.files)}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01, borderColor: "rgba(139,92,246,0.7)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isProcessingFiles && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files); }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-dashed transition-all text-left ${
                    dragOver
                      ? "border-violet-400 bg-violet-500/20"
                      : "border-white/25 bg-white/8 backdrop-blur hover:bg-white/15 hover:border-violet-400/60"
                  } ${isProcessingFiles ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
                >
                  <motion.div
                    animate={isProcessingFiles ? { rotate: 360 } : { y: [0, -4, 0] }}
                    transition={isProcessingFiles
                      ? { repeat: Infinity, duration: 0.9, ease: "linear" }
                      : { repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/40 to-rose-500/40 flex items-center justify-center shrink-0"
                  >
                    <Upload className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">
                      {isProcessingFiles ? "Processing files…" : "Upload photos or PDFs"}
                    </p>
                    <p className="text-white/50 text-xs">Prescriptions · Lab reports · Skin photos · Multiple files OK · JPG, PNG, PDF</p>
                  </div>
                  <div className="shrink-0 hidden sm:flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white/40 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">JPG</span>
                    <span className="text-xs font-bold text-white/40 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">PNG</span>
                    <span className="text-xs font-bold text-white/40 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">PDF</span>
                  </div>
                </motion.button>
              </motion.div>

              {/* Disease chips */}
              {popularDiseases && (
                <motion.div variants={fadeUp} custom={4} className="flex flex-wrap gap-2 mb-7">
                  {popularDiseases.map((d, i) => (
                    <motion.button
                      key={d.name}
                      whileHover={{ scale: 1.06, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(d.name)}
                      className="text-xs px-3.5 py-2 rounded-full border border-white/20 text-white/80 hover:bg-white/15 hover:text-white hover:border-white/40 transition-all font-medium backdrop-blur"
                      custom={i}
                    >
                      {d.name}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Quick tools */}
              <motion.div variants={fadeUp} custom={5} className="grid grid-cols-3 gap-3 mb-7">
                {[
                  { href: "/symptoms", icon: Activity, label: "Symptom Checker", color: "from-blue-500 to-violet-500" },
                  { href: "/early-detection", icon: Eye, label: "Early Detection", color: "from-rose-500 to-pink-500" },
                  { href: "/bmi", icon: Scale, label: "BMI Calculator", color: "from-emerald-500 to-teal-500" },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link key={href} href={href}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur hover:bg-white/15 transition-all cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white/80 text-center leading-tight">{label}</span>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>

              {/* Recently viewed */}
              <AnimatePresence>
                {recentDiseases.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3" /> Recently Viewed
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentDiseases.map((name) => (
                        <motion.button
                          key={name}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(name)}
                          className="text-xs px-3 py-1.5 rounded-full bg-violet-500/25 text-violet-200 font-medium border border-violet-400/30 hover:bg-violet-500/40 transition-all"
                        >
                          {name}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right: interactive cards */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:flex flex-col gap-5">

              {/* Rotating stat card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={statIndex}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-3xl bg-gradient-to-br ${stat.color} p-7 shadow-2xl`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-5xl font-black text-white">{stat.value}</p>
                      <p className="text-white/80 font-semibold">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Rotating category card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={catIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-3xl bg-white/10 backdrop-blur border border-white/20 p-6 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                      <cat.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-bold text-white">{cat.name}</p>
                    <span className="ml-auto text-white/40 text-xs">Popular Conditions</span>
                  </div>
                  {cat.diseases.map((d, j) => (
                    <motion.button
                      key={d}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: j * 0.07 }}
                      onClick={() => navigate(d)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 mb-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-white/80 text-sm font-medium transition-all cursor-pointer last:mb-0"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-white/40" /> {d}
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Upload card (desktop duplicate — input is shared, declared above in left column) */}
              <div>
                <motion.div
                  whileHover={{ scale: 1.01, borderColor: "rgba(139,92,246,0.6)" }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => !isProcessingFiles && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files); }}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all flex items-center gap-4 px-6 py-5 ${dragOver ? "border-violet-400 bg-violet-500/20" : "border-white/20 bg-white/8 backdrop-blur hover:border-violet-400/50"} ${isProcessingFiles ? "opacity-70 cursor-wait" : ""}`}
                >
                  <motion.div
                    animate={isProcessingFiles ? { rotate: 360 } : { y: [0, -5, 0] }}
                    transition={isProcessingFiles ? { repeat: Infinity, duration: 1, ease: "linear" } : { repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/40 to-rose-500/40 flex items-center justify-center shrink-0"
                  >
                    <Upload className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {isProcessingFiles ? "Processing files…" : "Upload photos or PDFs"}
                    </p>
                    <p className="text-white/50 text-xs">Prescriptions, lab results, rashes — JPG, PNG, PDF · Multiple files OK</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ TRUST STRIP ═══════════════════════════ */}
      <section className="bg-gradient-to-r from-violet-600 via-purple-600 to-rose-500 py-4">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-10 text-white">
            {[
              { icon: Zap, label: "Instant Results" },
              { icon: Shield, label: "Accurate & Safe" },
              { icon: Clock, label: "Available 24/7" },
              { icon: Sparkles, label: "500+ Conditions" },
              { icon: Users, label: "10K+ Users" },
              { icon: Award, label: "Trusted by Doctors" },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="w-4 h-4 text-white/80" />
                {label}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════ FEATURE GRID ═════════════════════════ */}
      <section className="py-24 bg-white dark:bg-card">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5">
              <Sparkles className="w-3 h-3" /> Everything in one place
            </span>
            <h2 className="text-5xl font-black font-display text-slate-900 dark:text-foreground mt-4 mb-3">
              Your complete health toolkit
            </h2>
            <p className="text-slate-500 dark:text-muted-foreground max-w-2xl mx-auto text-lg">Every tool you need to understand your health, make informed decisions, and take action.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Info, gradient: "from-blue-500 to-indigo-600", title: "Disease Overview", desc: "Full breakdown of any condition — causes, symptoms, risk factors in plain language.", tag: "Core Feature" },
              { icon: Apple, gradient: "from-green-500 to-emerald-600", title: "Personalized Food Guide", desc: "What to eat and avoid with medical reasons. Foods ranked by impact.", tag: "Nutrition" },
              { icon: Heart, gradient: "from-rose-500 to-pink-600", title: "Treatment Methods", desc: "Medical, Lifestyle, Diet, and Natural Remedy options — all in one dashboard.", tag: "Treatment" },
              { icon: Pill, gradient: "from-orange-500 to-amber-600", title: "Medicine Guide", desc: "Medications with dosages in mg/ml, purposes, and safety warnings.", tag: "Pharmacy" },
              { icon: Eye, gradient: "from-pink-500 to-rose-600", title: "Early Detection", desc: "Spot warning signs early. Risk factors, screenings, and self-assessment quiz.", tag: "Prevention" },
              { icon: Activity, gradient: "from-violet-500 to-purple-600", title: "Symptom Checker", desc: "Describe symptoms → possible conditions with urgency levels and next steps.", tag: "Diagnosis" },
              { icon: Scale, gradient: "from-sky-500 to-blue-600", title: "BMI Calculator", desc: "BMI with SVG gauge, personalized diet and exercise plan based on results.", tag: "Wellness" },
              { icon: Stethoscope, gradient: "from-teal-500 to-cyan-600", title: "Dr. Mahajan Chat", desc: "24/7 AI medical consultant. Ask anything, get evidence-based answers instantly.", tag: "Consultation" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.07 }}
                whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(0,0,0,0.1)" }}
                className="group relative bg-slate-50 dark:bg-muted/30 rounded-3xl border border-slate-100 dark:border-border p-6 overflow-hidden transition-all duration-300"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground px-2 py-1 rounded-full bg-white dark:bg-card border border-slate-200 dark:border-border">{f.tag}</span>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-foreground mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="py-24 bg-slate-50 dark:bg-background">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5">
              <TrendingUp className="w-3 h-3" /> How it works
            </span>
            <h2 className="text-5xl font-black font-display text-slate-900 dark:text-foreground mt-4 mb-3">
              Health clarity in 3 steps
            </h2>
            <p className="text-slate-500 dark:text-muted-foreground text-lg">No sign-up. No complexity. Just type and get clarity.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-14 left-[calc(16.7%+2rem)] right-[calc(16.7%+2rem)] h-0.5 bg-gradient-to-r from-violet-200 via-rose-200 to-blue-200 dark:from-violet-900/40 dark:via-rose-900/40 dark:to-blue-900/40" />

            {[
              { n: "01", icon: Search, title: "Search or Upload", desc: "Type any disease or condition name, or drag and drop a medical photo. We accept any medical query in plain language.", color: "from-violet-500 to-purple-600" },
              { n: "02", icon: BookOpen, title: "Get Full Analysis", desc: "Receive a comprehensive breakdown — causes, symptoms, diet guide, medicines with dosages, treatment options and early detection tips.", color: "from-rose-500 to-orange-500" },
              { n: "03", icon: CheckCircle2, title: "Take Action", desc: "Chat with Dr. Mahajan for specific questions, run a symptom check, calculate your BMI, or explore early detection strategies.", color: "from-blue-500 to-teal-500" },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                whileHover={{ y: -6, boxShadow: "0 24px 50px rgba(0,0,0,0.08)" }}
                className="relative flex flex-col items-center text-center p-10 rounded-3xl bg-white dark:bg-card border border-slate-100 dark:border-border transition-all duration-300"
              >
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-xl`}>
                  <step.icon className="w-9 h-9 text-white" />
                </div>
                <span className="text-xs font-black text-slate-300 dark:text-muted-foreground mb-2 tracking-widest">{step.n}</span>
                <h3 className="text-2xl font-black font-display text-slate-800 dark:text-foreground mb-3">{step.title}</h3>
                <p className="text-slate-500 dark:text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ DISEASE CATEGORIES ══════════════════════ */}
      <section className="py-24 bg-white dark:bg-card">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-4xl font-black font-display text-slate-900 dark:text-foreground">Browse by category</h2>
              <p className="text-slate-500 mt-1">Tap any condition to get the full breakdown</p>
            </div>
            <Link href="/symptoms">
              <motion.span whileHover={{ x: 4 }} className="flex items-center gap-2 text-violet-600 font-bold text-sm cursor-pointer">
                Check my symptoms <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DISEASE_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className="bg-slate-50 dark:bg-muted/30 rounded-3xl border border-slate-100 dark:border-border p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center shadow-md`}>
                    <cat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-lg text-slate-800 dark:text-foreground">{cat.name}</h3>
                </div>
                <div className="space-y-2">
                  {cat.diseases.map((d) => (
                    <motion.button
                      key={d}
                      whileHover={{ x: 6 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(d)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-slate-100 dark:border-border text-slate-700 dark:text-foreground text-sm font-medium hover:border-violet-200 hover:text-violet-600 dark:hover:border-violet-800 transition-all"
                    >
                      {d}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ STATS ROW ════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { val: 500, suf: "+", label: "Conditions Analyzed", color: "text-violet-400", desc: "From common colds to rare genetic disorders" },
              { val: 10000, suf: "+", label: "Users Helped", color: "text-rose-400", desc: "People who got health clarity instantly" },
              { val: 98, suf: "%", label: "Accuracy Rate", color: "text-emerald-400", desc: "Based on GPT medical analysis validation" },
              { val: 24, suf: "/7", label: "Available", color: "text-amber-400", desc: "Dr. Mahajan never sleeps" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <StatNumber value={s.val} suffix={s.suf} color={s.color} />
                <p className="text-white font-bold text-lg mt-2 mb-1">{s.label}</p>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HEALTH TIPS ═══════════════════════ */}
      <section className="py-24 bg-slate-50 dark:bg-background">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                <Heart className="w-3 h-3 fill-current" /> Daily Health Insights
              </span>
              <h2 className="text-5xl font-black font-display text-slate-900 dark:text-foreground mb-4">
                Small habits,<br />big results.
              </h2>
              <p className="text-slate-500 dark:text-muted-foreground text-lg leading-relaxed">Evidence-backed daily tips to improve your health, reduce risk, and feel better — starting today.</p>

              <div className="flex gap-3 mt-8">
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setTipIndex(i => (i - 1 + HEALTH_TIPS.length) % HEALTH_TIPS.length)}
                  className="w-11 h-11 rounded-full border border-slate-200 dark:border-border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-muted transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-500" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setTipIndex(i => (i + 1) % HEALTH_TIPS.length)}
                  className="w-11 h-11 rounded-full border border-slate-200 dark:border-border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-muted transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </motion.button>
              </div>
            </motion.div>

            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tipIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-border p-8 shadow-lg"
                >
                  <div className={`w-14 h-14 rounded-2xl ${tip.bg} flex items-center justify-center mb-6`}>
                    <tip.icon className={`w-7 h-7 ${tip.color}`} />
                  </div>
                  <p className="text-slate-700 dark:text-foreground text-xl leading-relaxed font-medium mb-6">{tip.tip}</p>
                  <div className="flex gap-1.5">
                    {HEALTH_TIPS.map((_, i) => (
                      <button key={i} onClick={() => setTipIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === tipIndex ? "w-8 bg-violet-500" : "w-1.5 bg-slate-200 dark:bg-muted"}`} />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Tip grid preview */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                {HEALTH_TIPS.map((t, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.04 }} onClick={() => setTipIndex(i)}
                    className={`p-3 rounded-2xl border transition-all ${i === tipIndex ? "border-violet-300 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800" : "border-slate-100 dark:border-border hover:border-slate-300 bg-white dark:bg-card"}`}>
                    <t.icon className={`w-5 h-5 ${t.color} mx-auto`} />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ CTA ═══════════════════════════ */}
      <section className="py-24 bg-white dark:bg-card">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            {[
              { pos: "-left-20 -top-20", color: "bg-violet-500/20", size: "w-64 h-64" },
              { pos: "-right-20 -bottom-20", color: "bg-rose-500/15", size: "w-80 h-80" },
            ].map((o, i) => (
              <motion.div key={i} className={`absolute ${o.pos} ${o.size} rounded-full blur-3xl ${o.color}`}
                animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 5 + i * 2 }} />
            ))}
            <div className="relative z-10">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="text-5xl mb-6 inline-block">🩺</motion.div>
              <h2 className="text-5xl font-black font-display text-white mb-4">Ready to understand your health?</h2>
              <p className="text-slate-300 text-xl mb-10 max-w-xl mx-auto">No sign-up, no complexity. Just type a disease or condition and get instant, comprehensive health insights.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/">
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-bold text-base shadow-xl cursor-pointer">
                    <Search className="w-5 h-5" /> Search a Disease
                  </motion.span>
                </Link>
                <Link href="/symptoms">
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-base cursor-pointer hover:bg-white/20 transition-colors">
                    <Activity className="w-5 h-5" /> Check Symptoms
                  </motion.span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
