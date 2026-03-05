import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGuard } from "@/components/AuthGuard";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import DailyNews from "./pages/DailyNews";
import DailyReports from "./pages/DailyReports";
import Agents from "./pages/Agents";
import Sources from "./pages/Sources";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected */}
              <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
              <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
              <Route path="/news" element={<AuthGuard><DailyNews /></AuthGuard>} />
              <Route path="/reports" element={<AuthGuard><DailyReports /></AuthGuard>} />
              <Route path="/agents" element={<AuthGuard><Agents /></AuthGuard>} />
              <Route path="/sources" element={<AuthGuard><Sources /></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
