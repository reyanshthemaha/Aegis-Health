import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Send, Loader2, MessageCircle, Minimize2, Maximize2, ChevronDown, Mic, MicOff } from "lucide-react";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";

interface Message { role: string; content: string; isVoice?: boolean }

const QUICK_QUESTIONS = [
  "What is normal blood pressure?",
  "Signs of diabetes?",
  "How to lower cholesterol?",
  "Symptoms of a heart attack?",
  "Foods that boost immunity?",
  "When to see a doctor for fever?",
];

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm Dr. Mahajan. Ask me anything about your health — symptoms, conditions, medications, diet, or anything else on your mind." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [convId, setConvId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const createConv = useCreateOpenaiConversation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  const getOrCreateConvId = async (): Promise<number> => {
    if (convId) return convId;
    const c = await createConv.mutateAsync({ data: { title: "Quick Consult" } });
    setConvId(c.id);
    return c.id;
  };

  const send = async (e?: React.FormEvent, override?: string) => {
    e?.preventDefault();
    const text = (override ?? input).trim();
    if (!text || isLoading) return;
    setInput("");
    setMessages(p => [...p, { role: "user", content: text }]);
    setIsLoading(true);
    try {
      const cid = await getOrCreateConvId();
      setMessages(p => [...p, { role: "assistant", content: "" }]);
      const res = await fetch(`/api/openai/conversations/${cid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      setMessages(p => {
        const n = [...p];
        n[n.length - 1].content = "Sorry, something went wrong. Please try again.";
        return n;
      });
    } finally { setIsLoading(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); sendVoice(); };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone access to use voice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoice = async () => {
    const chunks = audioChunksRef.current;
    if (!chunks.length) return;
    const blob = new Blob(chunks, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      if (!base64) return;
      setIsLoading(true);
      try {
        const cid = await getOrCreateConvId();
        setMessages(p => [...p, { role: "assistant", content: "" }]);
        const res = await fetch(`/api/openai/conversations/${cid}/voice-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ audioBase64: base64, format: "webm" }),
        });
        if (!res.body) throw new Error("no body");
        const readerSSE = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { value, done } = await readerSSE.read();
          if (done) break;
          const lines = dec.decode(value).split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.transcript) {
                setMessages(p => [...p, { role: "user", content: `🎤 ${d.transcript}`, isVoice: true }]);
              }
              if (d.content) setMessages(p => {
                const n = [...p];
                n[n.length - 1] = { ...n[n.length - 1], content: n[n.length - 1].content + d.content };
                return n;
              });
            } catch {}
          }
        }
      } catch {
        setMessages(p => {
          const n = [...p];
          n[n.length - 1].content = "Sorry, couldn't process your voice message. Please try again.";
          return n;
        });
      } finally { setIsLoading(false); }
    };
    reader.readAsDataURL(blob);
  };

  const panelW = expanded ? "w-[520px]" : "w-[360px] sm:w-[400px]";
  const panelH = expanded ? "h-[640px]" : "h-[520px]";

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className={`${panelW} ${panelH} bg-white dark:bg-card rounded-3xl shadow-2xl border border-border/60 flex flex-col overflow-hidden transition-all duration-300`}
            style={{ transformOrigin: "bottom right" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-4 flex items-center gap-3 shrink-0">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0"
              >
                <Heart className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white">Dr. Reyansh Mahajan</p>
                <div className="flex items-center gap-1.5">
                  <motion.span
                    animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0"
                  />
                  <span className="text-white/80 text-xs">Online · Medical Consultant</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setExpanded(e => !e)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  title={expanded ? "Shrink" : "Expand"}
                >
                  {expanded ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-muted/10">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                      <Heart className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-br-sm shadow-sm"
                      : "bg-white dark:bg-card border border-border/50 shadow-sm rounded-bl-sm text-slate-700 dark:text-foreground"
                  }`}>
                    {msg.content || (isLoading && i === messages.length - 1 ? (
                      <div className="flex gap-1 py-0.5">
                        {[0,1,2].map(j => (
                          <motion.div key={j} className="w-1.5 h-1.5 rounded-full bg-slate-400"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.65, delay: j * 0.15 }}
                          />
                        ))}
                      </div>
                    ) : "")}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick questions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 bg-slate-50 dark:bg-muted/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">Suggested questions</p>
                <div className={`grid ${expanded ? "grid-cols-2" : "grid-cols-1"} gap-1`}>
                  {QUICK_QUESTIONS.slice(0, expanded ? 6 : 3).map(q => (
                    <motion.button
                      key={q}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="text-xs text-left px-3 py-2.5 rounded-xl bg-white dark:bg-card border border-border/60 text-slate-600 dark:text-muted-foreground hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors leading-snug"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white dark:bg-card border-t border-border/60 shrink-0">
              {isRecording && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"
                  />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Recording... tap mic to send</span>
                </div>
              )}
              <form onSubmit={send} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Dr. Mahajan anything..."
                  disabled={isLoading || isRecording}
                  className="flex-1 text-sm px-4 py-2.5 rounded-full bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border focus:outline-none focus:ring-2 focus:ring-orange-400/50 text-foreground placeholder:text-slate-400 disabled:opacity-50 transition"
                />
                {/* Voice button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-40 shrink-0 transition-all ${
                    isRecording
                      ? "bg-rose-500 animate-pulse"
                      : "bg-gradient-to-r from-violet-500 to-purple-500"
                  }`}
                  title={isRecording ? "Stop recording" : "Voice message"}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading || !input.trim() || isRecording}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md disabled:opacity-40 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(o => !o)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shadow-2xl flex items-center justify-center text-white"
      >
        {/* Pulse rings */}
        <motion.span
          className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 opacity-50"
          animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 opacity-30"
          animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.4 }}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={open ? "x" : "msg"}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
          </motion.div>
        </AnimatePresence>
        {/* Unread dot */}
        {!open && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm"
          >
            <span className="text-[9px] font-black text-white">1</span>
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
