import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem('theme') || 'dark';
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('theme-dark', theme === 'dark');
  root.classList.toggle('theme-light', theme === 'light');
  localStorage.setItem('theme', theme);
};

const ThemeToggle = ({ compact = false }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const isLight = theme === 'light';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="theme-toggle inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
      title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {isLight ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
      {!compact && (
        <span className="ml-2 text-xs font-bold">{isLight ? 'Dark' : 'Light'}</span>
      )}
    </button>
  );
};

export default ThemeToggle;
