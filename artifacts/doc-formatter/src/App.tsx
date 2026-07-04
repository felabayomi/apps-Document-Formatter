import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { API_BASE_URL, clearAuthSession, getStoredToken, getStoredUser, type FormatterUser } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import LoginPage from "@/pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router({ user, onLogout }: { user: FormatterUser; onLogout: () => void }) {
  return (
    <Switch>
      <Route path="/">
        <Home currentUser={user} onLogout={onLogout} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<FormatterUser | null>(() => getStoredUser());

  useEffect(() => {
    setBaseUrl(API_BASE_URL);
    setAuthTokenGetter(() => getStoredToken());

    return () => {
      setAuthTokenGetter(null);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    queryClient.clear();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {user && user.document_formatter_access === false ? (
          <LoginPage currentUser={user} onSignedIn={setUser} onLogout={handleLogout} />
        ) : user ? (
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router user={user} onLogout={handleLogout} />
          </WouterRouter>
        ) : (
          <LoginPage onSignedIn={setUser} />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
