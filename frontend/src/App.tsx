import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SkillsLibrary from "./pages/SkillsLibrary";
import PracticeSession from "./pages/PracticeSession";
import Profile from "./pages/Profile";
import PracticeHistory from "./pages/PracticeHistory";
import LearningCurve from "./pages/LearningCurve";
import Header from "./components/Header";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <div className="min-h-screen flex flex-col items-center bg-background">
        <div className="w-full max-w-[1440px] flex flex-col min-h-screen shadow-2xl bg-background border-x border-border/50">
          <Header />
          <main className="flex-1 w-full p-6 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/skills" element={<SkillsLibrary />} />
              <Route path="/practice/:id" element={<PracticeSession />} />
              <Route path="/practice" element={<PracticeSession />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<PracticeHistory />} />
              <Route path="/learning-curve" element={<LearningCurve />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;