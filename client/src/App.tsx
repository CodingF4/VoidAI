import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme-provider";
import { PersonalizationProvider } from "@/hooks/use-personalization";
import { ProtectedRoute } from "@/lib/protected-route";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import SubscriptionPage from "@/pages/subscription";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Chat} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="void-chat-theme">
        <AuthProvider>
          <PersonalizationProvider>
            <Router />
            <Toaster />
          </PersonalizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;