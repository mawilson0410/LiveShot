import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import PlayerPage from "./pages/PlayerPage"
import PlayerTestsPage from "./pages/PlayerTestsPage"
import TestPage from "./pages/TestPage"
import ActiveTestPage from "./pages/ActiveTestPage"

import { useThemeStore } from "./store/useThemeStore.ts";

function App() {
  const { theme } = useThemeStore() as { theme: string };
  const location = useLocation();
  const isActiveTestPage = location.pathname.startsWith('/active-test/');

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300" data-theme={theme}>
      <Toaster position="top-center" />
      {/* Do not show navbar on active test page */}
      {!isActiveTestPage && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="/player/:id/tests" element={<PlayerTestsPage />} />
        <Route path="/test/:id" element={<TestPage />} />
        <Route path="/active-test/:id" element={<ActiveTestPage />} />
      </Routes>
    </div>
  );
}

export default App
