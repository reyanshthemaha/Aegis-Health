import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Activity, Scale, ShieldAlert, Moon, Sun, Menu, X, LogOut, User, History, Salad } from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { FloatingChat } from "./floating-chat";
import { useAuth } from "@workspace/replit-auth-web";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("aegis_theme") === "dark"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  /* Scroll progress bar */
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  /* Dark mode persistence */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("aegis_theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  /* Close mobile menu on route change */
  useEffect(() => { setMobileOpen(false); }, [location]);

  const navItems = [
    { href: "/symptoms", label: "Symptoms", icon: Activity },
    { href: "/early-detection", label: "Early Detection", icon: ShieldAlert },
    { href: "/bmi", label: "BMI", icon: Scale },
    { href: "/diet", label: "Diet Guide", icon: Salad },
    { href: "/history", label: "My History", icon: History },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-rose-500 origin-left z-[60]"
        style={{ scaleX }}
      />

      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl font-display shrink-0">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-md"
            >
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
            </motion.div>
            <span className="text-foreground">Aegis Health</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.span
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-muted"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <item.icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDark(!dark)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={dark ? "sun" : "moon"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* User info + logout */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                    {user.firstName || user.email || "User"}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border/50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </motion.button>
              </div>
            )}

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={mobileOpen ? "x" : "menu"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur md:hidden"
            >
              <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <motion.span
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition-colors cursor-pointer ${
                        location === item.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </motion.span>
                  </Link>
                ))}
                {user && (
                  <button
                    onClick={logout}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out ({user.firstName || user.email || "User"})
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <FloatingChat />

      <footer className="border-t border-border/40 bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-lg font-display">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span>Aegis Health</span>
            </div>
            <p className="text-muted-foreground text-sm text-center">
              For informational purposes only. Always consult a licensed medical professional.
            </p>
            <p className="text-sm text-muted-foreground">
              Made by <span className="font-semibold text-foreground">Reyansh Mahajan</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
