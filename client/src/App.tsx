import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { WindowControls } from "@/components/WindowControls";

import Dashboard from "@/pages/Dashboard";
import CalendarPage from "@/pages/Calendar";
import Reports from "@/pages/Reports";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Router hook={useHashLocation}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto w-full">
            <div className="flex justify-between items-center p-4 pb-0">
              <div className="flex-1" />
              <WindowControls />
            </div>
            <main className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/calendar" component={CalendarPage} />
                <Route path="/reports" component={Reports} />
                <Route path="/goals" component={Goals} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
