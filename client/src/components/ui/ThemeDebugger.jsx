import React from "react";
import { useTheme } from "../../context/ThemeContext";

export const ThemeDebugger = ({ show = false }) => {
  // Use the custom theme context to get theme details
  // This component is only for development purposes to debug theme settings
  const { isDarkMode, theme, isLoaded } = useTheme();

  if (!show || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="theme-card p-4 max-w-xs">
        <h3 className="text-sm font-bold theme-text-primary mb-2">
          Theme Debugger
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="theme-text-secondary">Theme:</span>
            <span className="theme-text-primary font-mono">{theme}</span>
          </div>
          <div className="flex justify-between">
            <span className="theme-text-secondary">Dark Mode:</span>
            <span className="theme-text-primary font-mono">
              {isDarkMode ? "true" : "false"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="theme-text-secondary">Loaded:</span>
            <span className="theme-text-primary font-mono">
              {isLoaded ? "true" : "false"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="theme-text-secondary">HTML Class:</span>
            <span className="theme-text-primary font-mono">
              {document.documentElement.classList.contains("dark")
                ? "dark"
                : "light"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="theme-text-secondary">Body Class:</span>
            <span className="theme-text-primary font-mono">
              {document.body.classList.contains("dark-theme")
                ? "dark-theme"
                : "light-theme"}
            </span>
          </div>
        </div>

        {/* Theme test elements */}
        <div className="mt-3 space-y-2">
          <div className="theme-bg-primary p-2 rounded text-xs theme-text-primary">
            Primary Background
          </div>
          <div className="theme-bg-secondary p-2 rounded text-xs theme-text-secondary">
            Secondary Background
          </div>
          <div className="theme-bg-tertiary p-2 rounded text-xs theme-text-tertiary">
            Tertiary Background
          </div>
        </div>
      </div>
    </div>
  );
};
