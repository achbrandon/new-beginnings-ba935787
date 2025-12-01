import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isAdminRoute: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get saved theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('vaultbank-admin-theme') as Theme;
    return savedTheme || 'dark';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  // Route checks
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isPublicRoute = !isAdminRoute && !isDashboardRoute;

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    if (isPublicRoute) {
      // Public/front pages - always light theme (original design)
      root.style.removeProperty('color-scheme');
      setActualTheme('light');
      return;
    }

    if (isDashboardRoute) {
      // Dashboard user pages - always dark theme
      root.style.setProperty('color-scheme', 'dark');
      root.classList.add('dark');
      setActualTheme('dark');
      return;
    }

    // Admin routes - respect theme selection
    if (isAdminRoute) {
      let effectiveTheme: 'light' | 'dark';

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        effectiveTheme = systemTheme;
      } else {
        effectiveTheme = theme;
      }

      root.style.setProperty('color-scheme', effectiveTheme);
      root.classList.add(effectiveTheme);
      setActualTheme(effectiveTheme);

      // Save to localStorage (only for admin)
      localStorage.setItem('vaultbank-admin-theme', theme);
    }
  }, [theme, isAdminRoute, isDashboardRoute, isPublicRoute]);

  // Listen for system theme changes when in system mode (admin only)
  useEffect(() => {
    if (theme !== 'system' || !isAdminRoute) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      root.style.setProperty('color-scheme', systemTheme);
      setActualTheme(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, isAdminRoute]);

  const setTheme = (newTheme: Theme) => {
    // Only allow theme changes on admin routes
    if (isAdminRoute) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    // Only allow theme toggle on admin routes
    if (isAdminRoute) {
      setThemeState((prev) => {
        if (prev === 'light') return 'dark';
        if (prev === 'dark') return 'light';
        return actualTheme === 'dark' ? 'light' : 'dark';
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme, isAdminRoute }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
