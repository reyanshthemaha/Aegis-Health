import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Disease from "@/pages/disease";
import Symptoms from "@/pages/symptoms";
import Bmi from "@/pages/bmi";
import EarlyDetection from "@/pages/early-detection";
import LoginPage from "@/pages/login";
import History from "@/pages/history";
import Diet from "@/pages/diet";
import { PasswordGate, usePasswordGate } from "@/components/password-gate";
import { useAuth } from "@workspace/replit-auth-web";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/disease/:name" component={Disease} />
        <Route path="/symptoms" component={Symptoms} />
        <Route path="/bmi" component={Bmi} />
        <Route path="/early-detection" component={EarlyDetection} />
        <Route path="/diet" component={Diet} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AuthGuard() {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0f0a1e]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return <Router />;
}

function App() {
  const { unlocked, unlock } = usePasswordGate();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          {!unlocked ? (
            <PasswordGate onUnlock={unlock} />
          ) : (
            <AuthGuard />
          )}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
