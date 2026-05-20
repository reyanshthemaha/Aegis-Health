import { motion } from "framer-motion";
import { Shield, Heart, Activity, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0a1e] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-pink-600/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-2xl shadow-purple-500/40">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Aegis Health</h1>
          <p className="text-white/50 text-lg">Your personal AI health companion</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-3 gap-3 mb-10"
        >
          {[
            { icon: Heart, label: "Disease Analysis", color: "from-rose-500 to-pink-600" },
            { icon: Activity, label: "Symptom Checker", color: "from-violet-500 to-purple-600" },
            { icon: Brain, label: "AI Consultant", color: "from-indigo-500 to-blue-600" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${color} mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-white/60 text-xs font-medium leading-tight">{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white mb-2 text-center">Sign in to continue</h2>
          <p className="text-white/40 text-sm text-center mb-6">
            Create an account or sign in to save your health history and personalize your experience.
          </p>

          <Button
            onClick={onLogin}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl border-0 shadow-lg shadow-purple-500/25 transition-all text-base"
          >
            Sign in / Sign up
          </Button>

          <p className="text-white/20 text-xs text-center mt-6">
            Made by Reyansh Mahajan · Your data stays private
          </p>
        </motion.div>
      </div>
    </div>
  );
}
