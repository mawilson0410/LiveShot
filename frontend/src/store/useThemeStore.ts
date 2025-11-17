import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("preferred-theme") || "forest",
  setTheme: (theme: any) => {
    localStorage.setItem("preferred-theme", theme);
    set({ theme });
  },
}));