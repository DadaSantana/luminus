// Initialize theme on app start
export const initializeTheme = () => {
  const isDark = localStorage.getItem('practia-theme');
  if (isDark) {
    const theme = JSON.parse(isDark);
    document.documentElement.classList.toggle('dark', theme.state.isDark);
  }
};

// Call on module load
initializeTheme();