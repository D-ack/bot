import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Platforms from "@/pages/platforms";
import MLConfig from "@/pages/ml-config";
import Conversations from "@/pages/conversations";
import Templates from "@/pages/templates";
import Analytics from "@/pages/analytics";
import Logs from "@/pages/logs";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden md:ml-64">
        <div className="h-full pt-16 md:pt-0">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/platforms" component={Platforms} />
            <Route path="/ml-config" component={MLConfig} />
            <Route path="/conversations" component={Conversations} />
            <Route path="/templates" component={Templates} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/logs" component={Logs} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
