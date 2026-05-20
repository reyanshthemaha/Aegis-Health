import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useAnalyzeDisease, useCreateOpenaiConversation } from "@workspace/api-client-react";
import {
  AlertCircle, AlertTriangle, Apple, Pill, Activity, Stethoscope,
  ShieldAlert, ArrowLeft, Loader2, Send, FileText, Dna, Heart,
  CheckCircle2, XCircle, Thermometer, Clock, Zap, Share2, Copy, Check,
  Upload, X, ImagePlus, RefreshCw
} from "lucide-react";
import { filesToBase64List } from "../lib/file-utils";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as any } }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const tabs = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "symptoms", label: "Symptoms", icon: Thermometer },
  { id: "treatment", label: "Treatment", icon: Stethoscope },
  { id: "medicines", label: "Medicines", icon: Pill },
  { id: "diet", label: "Diet Guide", icon: Apple },
];

const urgencyConfig: Record<string, { cls: string; heroBg: string; icon: React.ElementType; label: string; accent: string }> = {
  low:    { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", heroBg: "from-emerald-600 to-teal-600", icon: CheckCircle2, label: "Low Urgency",      accent: "text-emerald-400" },
  medium: { cls: "bg-amber-100 text-amber-800 border-amber-200",       heroBg: "from-amber-500 to-orange-600",  icon: Clock,       label: "Moderate Urgency", accent: "text-amber-400" },
  high:   { cls: "bg-red-100 text-red-800 border-red-200",             heroBg: "from-red-600 to-rose-600",      icon: Zap,         label: "High Urgency",     accent: "text-red-400" },
};

export default function Disease() {
  const params = useParams();
  const name = decodeURIComponent(params.name || "");
  const [activeTab, setActiveTab] = useState("overview");
  const analyzeDisease = useAnalyzeDisease();
  const fetchedRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [reAnalyzeImages, setReAnalyzeImages] = useState<string[]>([]);
  const [fileLabels, setFileLabels] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (name && !fetchedRef.current && !analyzeDisease.data && !analyzeDisease.isPending) {
      fetchedRef.current = true;
      let imagesBase64: string[] | undefined;
      try {
        const stored = sessionStorage.getItem("aegis_upload_images");
        if (stored) {
          imagesBase64 = JSON.parse(stored) as string[];
          sessionStorage.removeItem("aegis_upload_images");
        }
      } catch {}
      analyzeDisease.mutate({ data: { query: name, imagesBase64 } });
    }
  }, [name, analyzeDisease]);

  const handleUploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    const labels = Array.from(files).map(f => f.name);
    try {
      const imgs = await filesToBase64List(files);
      setReAnalyzeImages(imgs);
      setFileLabels(labels);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const runReAnalyze = useCallback(() => {
    if (reAnalyzeImages.length === 0) return;
    analyzeDisease.mutate({ data: { query: name, imagesBase64: reAnalyzeImages } });
  }, [reAnalyzeImages, name, analyzeDisease]);

  const data = analyzeDisease.data;
  const isLoading = analyzeDisease.isPending;
  const isError = analyzeDisease.isError;

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900">
        <div className="relative w-28 h-28 mb-10 mx-auto">
          <motion.div className="absolute inset-0 rounded-full border-4 border-violet-800" />
          <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-400"
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
          <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-b-rose-400"
            animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
          <motion.div className="absolute inset-3 rounded-full border-4 border-transparent border-t-amber-400/60"
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <Activity className="w-9 h-9 text-violet-400" />
            </motion.div>
          </div>
        </div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black font-display text-white mb-3">
          Analyzing {name}...
        </motion.h2>
        <p className="text-slate-400 max-w-md text-lg">Dr. Mahajan is consulting medical literature to prepare a comprehensive, jargon-free guide.</p>
        <div className="flex justify-center gap-1.5 mt-8">
          {[0,1,2,3].map(i => (
            <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-violet-400"
              animate={{ y: [0,-10,0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError || !data) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-background">
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
          <AlertCircle className="w-20 h-20 text-rose-500 mx-auto mb-6" />
        </motion.div>
        <h2 className="text-3xl font-black text-foreground mb-3">Analysis Failed</h2>
        <p className="text-muted-foreground mb-8 text-lg">We couldn't analyze "{name}". Please try a different search term.</p>
        <Link href="/">
          <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-bold shadow-lg cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </motion.span>
        </Link>
      </motion.div>
    );
  }

  const urg = urgencyConfig[data.urgencyLevel] ?? urgencyConfig.low;
  const UrgIcon = urg.icon;

  return (
    <div className="bg-slate-50 dark:bg-background min-h-screen pb-24">

      {/* ── Full-width hero banner ── */}
      <div className={`bg-gradient-to-br ${urg.heroBg} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {[
          { pos: "-left-20 -top-20", size: "w-72 h-72" },
          { pos: "-right-10 bottom-0", size: "w-64 h-64" },
        ].map((o, i) => (
          <motion.div key={i} className={`absolute ${o.pos} ${o.size} rounded-full bg-white/10 blur-3xl`}
            animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 6 + i * 2 }} />
        ))}

        <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/">
              <motion.span whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.span>
            </Link>
            <motion.button onClick={handleCopy}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="ml-auto w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-white" />}
            </motion.button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Disease Analysis</motion.p>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-white capitalize leading-tight mb-4">
                {data.name}
              </motion.h1>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white/15 text-white border-white/30 text-sm font-bold backdrop-blur`}>
                  <UrgIcon className="w-4 h-4" />
                  {urg.label}
                </span>
              </motion.div>
            </div>

            {/* Quick stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-3 lg:w-auto w-full">
              {[
                { label: "Causes", value: data.causes.length },
                { label: "Symptoms", value: data.symptoms.length },
                { label: "Treatments", value: data.treatments.length },
              ].map(s => (
                <div key={s.label} className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-white/70 text-xs font-semibold">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Animated tab bar */}
        <div className="max-w-[1400px] mx-auto px-6 pb-0 relative z-10">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-white/20">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                    active ? "text-white" : "text-white/60 hover:text-white/90"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                  {active && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >

                {/* OVERVIEW */}
                {activeTab === "overview" && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                    <motion.div variants={fadeUp} className="bg-white dark:bg-card rounded-3xl border border-border/60 overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-6 border-b border-violet-100 dark:border-violet-900/30">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-foreground">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          What is {data.name}?
                        </h2>
                      </div>
                      <div className="p-6">
                        <p className="text-slate-700 dark:text-muted-foreground leading-relaxed text-base">{data.overview}</p>
                      </div>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <motion.div variants={fadeUp} custom={1} className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border/40">
                          <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-foreground">
                            <Dna className="w-5 h-5 text-indigo-500" /> Common Causes
                          </h3>
                        </div>
                        <div className="p-5">
                          <ul className="space-y-3">
                            {data.causes.map((cause, i) => (
                              <motion.li key={i} variants={fadeUp} custom={i} className="flex items-start gap-3 text-slate-600 dark:text-muted-foreground">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                </div>
                                <span className="text-sm">{cause}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>

                      <motion.div variants={fadeUp} custom={2} className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-3xl border border-purple-100 dark:border-purple-900/30 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-purple-100 dark:border-purple-900/30">
                          <h3 className="font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
                            <ShieldAlert className="w-5 h-5 text-purple-500" /> Early Warning Signs
                          </h3>
                        </div>
                        <div className="p-5">
                          <ul className="space-y-3">
                            {data.earlyDetection.map((tip, i) => (
                              <motion.li key={i} variants={fadeUp} custom={i} className="flex items-start gap-3 text-purple-800 dark:text-purple-300">
                                <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                                <span className="text-sm">{tip}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    </div>

                    {/* Disclaimer */}
                    <motion.div variants={fadeUp} custom={3} className="bg-slate-100 dark:bg-muted/30 text-slate-500 dark:text-muted-foreground text-xs p-4 rounded-2xl text-center">
                      {data.disclaimer}
                    </motion.div>
                  </motion.div>
                )}

                {/* SYMPTOMS */}
                {activeTab === "symptoms" && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                    <motion.div variants={fadeUp} className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-6 border-b border-red-100 dark:border-red-900/30">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-foreground">
                          <Activity className="w-5 h-5 text-red-500" /> Recognizing the Symptoms
                        </h2>
                        <p className="text-slate-500 dark:text-muted-foreground text-sm mt-1">Common physical and psychological indicators of {data.name}</p>
                      </div>
                      <div className="p-6 grid sm:grid-cols-2 gap-3">
                        {data.symptoms.map((symptom, i) => (
                          <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ scale: 1.02, x: 4 }}
                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border">
                            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 text-red-600 font-black text-xs">{i + 1}</div>
                            <span className="text-sm font-medium text-slate-700 dark:text-foreground">{symptom}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* TREATMENT */}
                {activeTab === "treatment" && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                    <motion.div variants={fadeUp} className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 p-6 border-b border-blue-100 dark:border-blue-900/30">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-foreground">
                          <Stethoscope className="w-5 h-5 text-blue-500" /> Treatment Approaches
                        </h2>
                        <p className="text-slate-500 dark:text-muted-foreground text-sm mt-1">Medical and lifestyle strategies for managing {data.name}</p>
                      </div>
                      <div className="p-6 space-y-3">
                        {data.treatments.map((treatment, i) => (
                          <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ x: 4 }}
                            className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-muted/30 border border-transparent hover:border-slate-100 dark:hover:border-border transition-all">
                            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                              <Stethoscope className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-800 dark:text-foreground">{treatment.name}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-muted text-slate-500 dark:text-muted-foreground capitalize">{treatment.type}</span>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">{treatment.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* MEDICINES — separate full tab */}
                {activeTab === "medicines" && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                    {data.medicines.length === 0 ? (
                      <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-card rounded-3xl border border-border/60">
                        <Pill className="w-16 h-16 text-slate-300 mb-5" />
                        <p className="font-bold text-slate-600 dark:text-foreground text-xl mb-2">No specific medicines listed</p>
                        <p className="text-slate-400 text-sm">This condition is typically managed through lifestyle changes or natural remedies.</p>
                      </motion.div>
                    ) : (
                      <>
                        <motion.div variants={fadeUp} className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 p-6 border-b border-teal-100 dark:border-teal-900/30">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-foreground">
                              <Pill className="w-5 h-5 text-teal-500" /> Common Medications
                            </h2>
                            <p className="text-slate-500 dark:text-muted-foreground text-sm mt-1">Always consult a doctor before starting any medication</p>
                          </div>
                          <div className="p-6 space-y-4">
                            {data.medicines.map((med, i) => (
                              <motion.div key={i} variants={fadeUp} custom={i}
                                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
                                className="p-5 border border-slate-100 dark:border-border rounded-2xl bg-slate-50/50 dark:bg-muted/20 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-black text-teal-900 dark:text-teal-300 text-lg">{med.name}</h4>
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${med.type === "prescription" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" : "bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground"}`}>
                                    {med.type}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-muted-foreground mb-4 leading-relaxed">{med.purpose}</p>
                                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-border">
                                  <div className="bg-white dark:bg-card rounded-xl p-3 border border-slate-100 dark:border-border">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Typical Dosage</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-foreground">{med.dosage}</span>
                                  </div>
                                  <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-900/20">
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Warning
                                    </span>
                                    <span className="text-sm text-slate-600 dark:text-muted-foreground">{med.warnings}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        <motion.div variants={fadeUp} custom={1} className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-900/30 p-5 flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                            <strong>Important:</strong> Dosages listed are typical ranges. Your doctor may prescribe different amounts based on your age, weight, kidney function, and other medications. Never self-medicate without professional consultation.
                          </p>
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* DIET */}
                {activeTab === "diet" && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <motion.div variants={fadeUp} custom={0} className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-emerald-100 dark:border-emerald-900/30">
                          <h3 className="font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                            <Apple className="w-5 h-5 text-emerald-500" /> Foods to Eat
                          </h3>
                          <p className="text-emerald-600/70 dark:text-emerald-400/70 text-xs mt-1">Beneficial for {data.name}</p>
                        </div>
                        <div className="p-5">
                          <ul className="space-y-2.5">
                            {data.foodsToEat.map((food, i) => (
                              <motion.li key={i} variants={fadeUp} custom={i} whileHover={{ x: 4 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 text-emerald-900 dark:text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="text-sm font-medium">{food}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>

                      <motion.div variants={fadeUp} custom={1} className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/30 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-rose-100 dark:border-rose-900/30">
                          <h3 className="font-bold flex items-center gap-2 text-rose-800 dark:text-rose-300">
                            <XCircle className="w-5 h-5 text-rose-500" /> Foods to Avoid
                          </h3>
                          <p className="text-rose-600/70 dark:text-rose-400/70 text-xs mt-1">Harmful for {data.name}</p>
                        </div>
                        <div className="p-5">
                          <ul className="space-y-2.5">
                            {data.foodsToAvoid.map((food, i) => (
                              <motion.li key={i} variants={fadeUp} custom={i} whileHover={{ x: 4 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 text-rose-900 dark:text-rose-300">
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="text-sm font-medium">{food}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div variants={fadeUp} custom={2} className="bg-white dark:bg-card rounded-3xl border border-border/60 p-5 flex gap-3">
                      <Apple className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">
                        Dietary changes complement medical treatment but should not replace it. Individual nutritional needs vary. Consider consulting a registered dietitian for a personalised meal plan tailored to your specific health status.
                      </p>
                    </motion.div>
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Upload & Re-analyze card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-border/60 shadow-sm bg-white dark:bg-card overflow-hidden"
            >
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 px-5 py-4 border-b border-border/40">
                <h3 className="font-bold text-slate-800 dark:text-foreground flex items-center gap-2 text-sm">
                  <ImagePlus className="w-4 h-4 text-violet-500" />
                  Analyze with Your Photos
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Upload prescriptions, lab reports, or photos for a personalized analysis.</p>
              </div>
              <div className="p-4 space-y-3">
                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files.length > 0 && handleUploadFiles(e.target.files)}
                />

                {/* File list */}
                {fileLabels.length > 0 && (
                  <div className="space-y-1.5">
                    {fileLabels.map((label, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-violet-50 dark:bg-violet-900/20 rounded-xl px-3 py-2 border border-violet-100 dark:border-violet-800">
                        <FileText className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span className="truncate text-slate-600 dark:text-muted-foreground flex-1">{label}</span>
                        {reAnalyzeImages[i] && (
                          <img src={`data:image/jpeg;base64,${reAnalyzeImages[i]}`} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-violet-200 dark:border-violet-800" />
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => { setFileLabels([]); setReAnalyzeImages([]); if (uploadRef.current) uploadRef.current.value = ""; }}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  </div>
                )}

                {/* Upload button */}
                <button
                  onClick={() => uploadRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-2xl py-3 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors disabled:opacity-60"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isProcessing ? "Processing…" : fileLabels.length > 0 ? "Add more files" : "Choose photos or PDF"}
                </button>

                {/* Re-analyze button */}
                {reAnalyzeImages.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={runReAnalyze}
                    disabled={analyzeDisease.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                  >
                    {analyzeDisease.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {analyzeDisease.isPending ? "Re-analyzing…" : `Re-analyze with ${reAnalyzeImages.length} image${reAnalyzeImages.length !== 1 ? "s" : ""}`}
                  </motion.button>
                )}
              </div>
            </motion.div>

            <ChatSidebar diseaseName={data.name} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline chat sidebar ── */
function ChatSidebar({ diseaseName }: { diseaseName: string }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hello! I'm Dr. Mahajan. Ask me anything about ${diseaseName} — symptoms, medications, diet, or anything else.` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [convId, setConvId] = useState<number | null>(null);
  const createConv = useCreateOpenaiConversation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", content: text }]);
    setIsLoading(true);
    try {
      let cid = convId;
      if (!cid) {
        const c = await createConv.mutateAsync({ data: { title: `${diseaseName} Consult` } });
        cid = c.id; setConvId(c.id);
      }
      setMessages(p => [...p, { role: "assistant", content: "" }]);
      const res = await fetch(`/api/openai/conversations/${cid}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const lines = dec.decode(value).split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const d = JSON.parse(line.slice(6));
            if (d.content) setMessages(p => {
              const n = [...p];
              n[n.length - 1] = { ...n[n.length - 1], content: n[n.length - 1].content + d.content };
              return n;
            });
          } catch {}
        }
      }
    } catch {
      setMessages(p => { const n = [...p]; n[n.length - 1].content = "Sorry, something went wrong. Please try again."; return n; });
    } finally { setIsLoading(false); }
  };

  const quickPrompts = [
    `What causes ${diseaseName}?`,
    `Best foods for ${diseaseName}?`,
    `Is ${diseaseName} curable?`,
    `How to prevent ${diseaseName}?`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="sticky top-20 h-[calc(100vh-8rem)] flex flex-col rounded-3xl border border-border/60 shadow-xl bg-white dark:bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white shrink-0">
        <div className="flex items-center gap-3">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </motion.div>
          <div className="flex-1">
            <p className="font-bold text-sm">Dr. Reyansh Mahajan</p>
            <div className="flex items-center gap-1.5">
              <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-white/80 text-xs">Online · Medical Consultant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-muted/10">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-tr-sm shadow-sm"
                : "bg-white dark:bg-card border border-border/50 shadow-sm rounded-tl-sm text-slate-700 dark:text-foreground"
            }`}>
              {msg.content || (isLoading && i === messages.length - 1 ? (
                <div className="flex gap-1 py-0.5">
                  {[0,1,2].map(j => (
                    <motion.div key={j} className="w-1.5 h-1.5 rounded-full bg-slate-400"
                      animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: j*0.15 }} />
                  ))}
                </div>
              ) : "")}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 bg-slate-50 dark:bg-muted/10 grid grid-cols-2 gap-1.5">
          {quickPrompts.map(q => (
            <motion.button key={q} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setInput(q)}
              className="text-[11px] text-left px-3 py-2 rounded-xl bg-white dark:bg-card border border-border/60 text-slate-600 dark:text-muted-foreground hover:border-orange-300 hover:text-orange-600 transition-colors leading-tight">
              {q}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white dark:bg-card border-t border-border/60 shrink-0">
        <form onSubmit={send} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask about ${diseaseName}...`}
            disabled={isLoading}
            className="flex-1 text-sm px-4 py-2.5 rounded-full bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border focus:outline-none focus:ring-2 focus:ring-orange-400/50 text-foreground placeholder:text-slate-400 disabled:opacity-50 transition"
          />
          <motion.button type="submit" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md disabled:opacity-40 shrink-0">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
