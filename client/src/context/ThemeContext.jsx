import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // State to manage dark mode and loading state - ALWAYS start with light mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Force light mode initialization on app startup
  useEffect(() => {
    // Ensure light mode on every app startup
    const root = document.documentElement;
    root.classList.remove("dark");
    document.body.className = 'light';
    
    // Force clear any existing theme preference to ensure light mode default
    // Uncomment the next line if you want to completely reset theme on every startup
    // localStorage.removeItem("SilverCare_theme");
    
    const savedTheme = localStorage.getItem("SilverCare_theme");

    // Only use saved theme if it exists, otherwise default to light mode
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === "dark");
    } else {
      // Force light mode as default, ignore system preference
      setIsDarkMode(false);
      // Set initial light mode in localStorage
      localStorage.setItem("SilverCare_theme", "light");
    }

    setIsLoaded(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;

    // Add theme transition class for smooth switching
    root.classList.add("theme-transition");

    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Also update body class for scrollbar consistency
    document.body.className = isDarkMode ? 'dark' : 'light';

    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 300);

    return () => clearTimeout(timer);
  }, [isDarkMode, isLoaded]);

  // Save theme preference to localStorage
  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem("SilverCare_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode, isLoaded]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setTheme = (theme) => {
    setIsDarkMode(theme === "dark");
  };

  // Utility function to force reset to light mode
  const resetToLight = () => {
    setIsDarkMode(false);
    localStorage.setItem("SilverCare_theme", "light");
  };

  const value = {
    isDarkMode,
    isLoaded,
    toggleTheme,
    setTheme,
    resetToLight,
    theme: isDarkMode ? "dark" : "light",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
