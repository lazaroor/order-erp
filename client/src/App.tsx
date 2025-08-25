import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import Orders from "@/pages/orders";
import CashFlow from "@/pages/cash-flow";
import Products from "@/pages/products";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { UserRole } from "../../shared/schema";

function Router() {
  const { user } = useAuth();
  return (
    <Switch>
      <Route path="/" component={Orders} />
      {user?.role === UserRole.Admin && (
        <>
          <Route path="/caixa" component={CashFlow} />
          <Route path="/produtos" component={Products} />
          <Route path="/usuarios" component={Users} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex bg-gray-50">
          <Sidebar />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
