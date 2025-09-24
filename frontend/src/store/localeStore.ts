import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from 'date-fns';
import { enUS, ptBR, es } from 'date-fns/locale';

export type SupportedLocale = 'pt-BR' | 'en-US' | 'es';

interface LocaleState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

// Helper to map our locale codes to date-fns locales
const dateFnsLocaleMap: Record<SupportedLocale, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es': es,
} as unknown as Record<SupportedLocale, Locale>;

// Export a function to retrieve the date-fns locale object
export function getDateFnsLocale(code: SupportedLocale) {
  return dateFnsLocaleMap[code] || ptBR;
}

function getDefaultLocale(): SupportedLocale {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator.language : 'pt-BR';
    if (nav.toLowerCase().startsWith('pt')) return 'pt-BR';
    if (nav.toLowerCase().startsWith('es')) return 'es';
    return 'en-US';
  } catch {
    return 'pt-BR';
  }
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: getDefaultLocale(),
      setLocale: (locale) => set(() => ({ locale })),
    }),
    { name: 'practia-locale' }
  )
);