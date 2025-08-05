import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = () => {
    const { isDarkMode, toggleTheme, isLoaded } = useTheme();

    if (!isLoaded) {
        // Show a skeleton while theme is loading
        return (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative w-10 h-10 rounded-full p-2
        bg-gray-100 dark:bg-gray-800
        border border-gray-200 dark:border-gray-600
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-300 ease-in-out
        group
        ${isDarkMode ? 'animate-theme-toggle' : ''}
      `}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* Moon Icon for Light Mode */}
            <Moon
                className={`
          absolute inset-0 m-auto w-5 h-5
          text-blue-400
          transition-all duration-300 ease-in-out
          ${!isDarkMode
                        ? 'opacity-100 rotate-0 scale-100'
                        : 'opacity-0 -rotate-90 scale-0'
                    }
        `}
            />

            {/* Sun Icon for Dark Mode */}
            <Sun
                className={`
          absolute inset-0 m-auto w-5 h-5
          text-yellow-500
          transition-all duration-300 ease-in-out
          ${isDarkMode
                        ? 'opacity-100 rotate-0 scale-100'
                        : 'opacity-0 rotate-90 scale-0'
                    }
        `}
            />

            {/* Ripple effect on click */}
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-0 group-active:opacity-20 transition-opacity duration-150" />
        </button>
    );
};