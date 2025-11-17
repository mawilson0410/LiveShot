import { Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import PlayerPage from "./pages/PlayerPage"
import TestPage from "./pages/TestPage"
import ActiveTestPage from "./pages/ActiveTestPage"

import { useThemeStore } from "./store/useThemeStore.ts";

function App() {
  const { theme } = useThemeStore() as { theme: string };
  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300" data-theme={theme}>

      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="/test/:id" element={<TestPage />} />
        <Route path="/active-test/:id" element={<ActiveTestPage />} />
      </Routes>
    </div>
  );
}

export default App
