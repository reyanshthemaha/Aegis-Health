import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  History, Trash2, Search, Activity, Scale, MessageCircle,
  ChevronRight, AlertTriangle, CheckCircle, Clock, Stethoscope,
  TrendingUp, BarChart2, Calendar, ShieldCheck, Sparkles, Loader2,
  RefreshCw, Lightbulb, Star,
} from "lucide-react";
import { useGetUserHealthHistory, useDeleteHealthHistoryItem, useGetHealthSummary, getGetHealthSummaryQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG = {
  disease: {
    icon: Stethoscope,
    label: "Disease Analysis",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700/40",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  symptom: {
    icon: Activity,
    label: "Symptom Check",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-700/40",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
  bmi: {
    icon: Scale,
    label: "BMI Calculator",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700/40",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
} as const;

const URGENCY_CONFIG = {
  low: { icon: CheckCircle, text: "Low urgency", color: "text-emerald-600 dark:text-emerald-400" },
  medium: { icon: Clock, text: "Medium urgency", color: "text-amber-600 dark:text-amber-400" },
  high: { icon: AlertTriangle, text: "High urgency", color: "text-rose-600 dark:text-rose-400" },
  emergency: { icon: AlertTriangle, text: "Emergency", color: "text-red-700 dark:text-red-400" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

type HistoryItem = {
  id: number;
  type: "disease" | "symptom" | "bmi";
  query: string;
  summary?: string | null;
  createdAt: string;
  resultJson: Record<string, unknown>;
};

function HistoryCard({ item, onDelete }: { item: HistoryItem; onDelete: (id: number) => void }) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const urgency = (item.resultJson?.urgencyLevel as string) ?? null;
  const urgencyConf = urgency ? URGENCY_CONFIG[urgency as keyof typeof URGENCY_CONFIG] : null;

  const href = item.type === "disease"
    ? `/disease/${encodeURIComponent(item.query)}`
    : item.type === "symptom"
    ? "/symptoms"
    : "/bmi";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`group relative rounded-2xl border ${config.border} ${config.bg} p-4 flex items-start gap-4 hover:shadow-md transition-all`}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
            {config.label}
          </span>
          {urgencyConf && (
            <span className={`text-xs flex items-center gap-1 ${urgencyConf.color}`}>
              <urgencyConf.icon className="w-3 h-3" />
              {urgencyConf.text}
            </span>
          )}
        </div>
        <p className="font-semibold text-foreground text-sm truncate capitalize">{item.query}</p>
        {item.summary && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.summary}</p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(item.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.type === "disease" && (
          <Link href={href}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-all px-2 py-1.5 rounded-lg hover:bg-background/60"
            >
              View
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          </Link>
        )}
        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5"
            >
              <button
                onClick={() => onDelete(item.id)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-muted/60 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="trash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setConfirmDelete(true)}
              className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { data: history, isLoading, refetch } = useGetUserHealthHistory();
  const deleteMutation = useDeleteHealthHistoryItem();
  const [filter, setFilter] = useState<"all" | "disease" | "symptom" | "bmi">("all");
  const [showSummary, setShowSummary] = useState(false);
  const {
    data: summary,
    isFetching: summaryLoading,
    refetch: fetchSummary,
  } = useGetHealthSummary({ query: { queryKey: getGetHealthSummaryQueryKey(), enabled: false } });

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    refetch();
  };

  const items = (history as HistoryItem[] | undefined) ?? [];
  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);

  const stats = {
    total: items.length,
    disease: items.filter(i => i.type === "disease").length,
    symptom: items.filter(i => i.type === "symptom").length,
    bmi: items.filter(i => i.type === "bmi").length,
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-medium">Health Journey</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              {greeting()}, {firstName}!
            </h1>
            <p className="text-white/70 text-base">Your personal health activity at a glance.</p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8"
          >
            {[
              { label: "Total Activities", value: stats.total, icon: BarChart2, color: "bg-white/20" },
              { label: "Disease Searches", value: stats.disease, icon: Stethoscope, color: "bg-purple-400/30" },
              { label: "Symptom Checks", value: stats.symptom, icon: Activity, color: "bg-pink-400/30" },
              { label: "BMI Checks", value: stats.bmi, icon: TrendingUp, color: "bg-teal-400/30" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`${color} backdrop-blur-sm rounded-2xl p-4 border border-white/10`}>
                <Icon className="w-5 h-5 mb-2 opacity-80" />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-white/70 font-medium">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* AI Health Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 rounded-3xl border border-violet-200 dark:border-violet-800/40 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-900/20 dark:via-purple-900/15 dark:to-indigo-900/20 overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Dr. Mahajan's Health Summary</p>
                  <p className="text-xs text-muted-foreground">AI-generated based on your activity</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSummary(true);
                  fetchSummary();
                }}
                disabled={summaryLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-60"
              >
                {summaryLoading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                ) : summary && showSummary ? (
                  <><RefreshCw className="w-3.5 h-3.5" /> Refresh</>
                ) : (
                  <><Star className="w-3.5 h-3.5" /> Generate Summary</>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {showSummary && summary && !summaryLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-violet-200 dark:border-violet-800/40 space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>

                    {summary.insights.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" /> Insights
                        </p>
                        <ul className="space-y-1.5">
                          {summary.insights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <ChevronRight className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3" /> Recommendations
                        </p>
                        <ul className="space-y-1.5">
                          {summary.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground/60">
                      Generated {new Date(summary.generatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              )}

              {showSummary && summaryLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pt-3 border-t border-violet-200 dark:border-violet-800/40"
                >
                  <div className="space-y-2.5">
                    {[80, 60, 70].map((w, i) => (
                      <div key={i} className={`h-3 rounded-full bg-violet-200 dark:bg-violet-800/40 animate-pulse`}
                        style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {(["all", "disease", "symptom", "bmi"] as const).map(f => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? "text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {filter === f && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-purple-600"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative capitalize">
                {f === "all" ? `All (${stats.total})` : f === "disease" ? `Disease (${stats.disease})` : f === "symptom" ? `Symptoms (${stats.symptom})` : `BMI (${stats.bmi})`}
              </span>
            </motion.button>
          ))}
        </div>

        {/* History list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">No history yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              {filter === "all"
                ? "Start by searching for a disease, checking your symptoms, or calculating your BMI."
                : `No ${filter} activity yet. Try using that feature!`}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Search className="w-3.5 h-3.5" />
                  Search a disease
                </Button>
              </Link>
              <Link href="/symptoms">
                <Button variant="outline" size="sm" className="gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Check symptoms
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item as HistoryItem}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Quick links at bottom */}
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 p-5 rounded-2xl bg-muted/50 border border-border/50"
          >
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              Continue your health journey
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Search className="w-3 h-3" /> Search disease
                </Button>
              </Link>
              <Link href="/symptoms">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Activity className="w-3 h-3" /> Symptom check
                </Button>
              </Link>
              <Link href="/bmi">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Scale className="w-3 h-3" /> BMI calculator
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
