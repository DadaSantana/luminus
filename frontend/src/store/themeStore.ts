import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => {
        const newTheme = !state.isDark;
        document.documentElement.classList.toggle('dark', newTheme);
        return { isDark: newTheme };
      }),
      setTheme: (isDark) => set(() => {
        document.documentElement.classList.toggle('dark', isDark);
        return { isDark };
      }),
    }),
    {
      name: 'practia-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.toggle('dark', state.isDark);
        }
      },
    }
  )
);