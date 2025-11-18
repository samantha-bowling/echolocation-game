import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Tutorial from "./pages/Tutorial";
import ChapterSelect from "./pages/ChapterSelect";
import { ClassicGame } from "./components/ClassicGame";
import { CustomMode } from "./components/CustomMode";
import { CustomGame } from "./components/CustomGame";
import { CustomStats } from "./components/CustomStats";
import { ClassicStats } from "./components/ClassicStats";
import { Settings } from "./components/Settings";
import { Credits } from "./components/Credits";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/chapters" element={<ChapterSelect />} />
            <Route path="/classic" element={<ClassicGame />} />
            <Route path="/classic-stats" element={<ClassicStats />} />
            <Route path="/custom" element={<CustomMode />} />
            <Route path="/custom-game" element={<CustomGame />} />
            <Route path="/custom-stats" element={<CustomStats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/credits" element={<Credits />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
