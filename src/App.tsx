import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
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
import { migrateToIndexedDB } from "./lib/game/migrateToIndexedDB";
import { importFromShareURL } from "./lib/game/exportImport";
import { saveGameSessionDB } from "./lib/game/customSessionDB";
import { toast } from "./hooks/use-toast";

const queryClient = new QueryClient();

// Import handler component
function ImportHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;

    const params = new URLSearchParams(location.search);
    const importCode = params.get('import');

    if (importCode && location.pathname === '/custom') {
      setHandled(true);

      importFromShareURL(importCode)
        .then(async (session) => {
          // Save the imported session
          await saveGameSessionDB(session);

          // Show success toast
          toast({
            title: 'Game Imported',
            description: 'Successfully imported game from share link',
            duration: 3000,
          });

          // Clean URL and navigate
          navigate('/custom', { replace: true });
        })
        .catch((error) => {
          console.error('Import failed:', error);
          toast({
            title: 'Import Failed',
            description: error.message || 'Invalid share link',
            variant: 'destructive',
            duration: 4000,
          });

          // Clean URL
          navigate('/custom', { replace: true });
        });
    }
  }, [location, navigate, handled]);

  return null;
}

const App = () => {
  // Run migration on app mount
  useEffect(() => {
    migrateToIndexedDB().catch((error) => {
      console.error('Migration failed:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ImportHandler />
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
};

export default App;
