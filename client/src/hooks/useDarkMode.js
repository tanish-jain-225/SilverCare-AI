import { useTheme } from "../context/ThemeContext";

export const useDarkMode = () => {
  const { isDarkMode, theme, isLoaded } = useTheme();

  // Common color mappings for consistent theming - these can be customized further
  const colors = {
    // Background colors
    background: {
      primary: "bg-white dark:bg-gray-900",
      secondary: "bg-gray-50 dark:bg-gray-800",
      tertiary: "bg-gray-100 dark:bg-gray-700",
      card: "bg-white dark:bg-gray-800",
      modal: "bg-white dark:bg-gray-800",
      overlay: "bg-black/50 dark:bg-black/70",
    },

    // Text colors
    text: {
      primary: "text-gray-900 dark:text-gray-100",
      secondary: "text-gray-700 dark:text-gray-300",
      tertiary: "text-gray-500 dark:text-gray-400",
      muted: "text-gray-400 dark:text-gray-500",
      inverse: "text-white dark:text-gray-900",
      link: "text-blue-600 dark:text-blue-400",
      linkHover: "text-blue-700 dark:text-blue-300",
    },

    // Border colors
    border: {
      primary: "border-gray-200 dark:border-gray-700",
      secondary: "border-gray-300 dark:border-gray-600",
      accent: "border-blue-200 dark:border-blue-800",
      error: "border-red-200 dark:border-red-800",
      success: "border-green-200 dark:border-green-800",
      warning: "border-yellow-200 dark:border-yellow-800",
    },

    // Interactive states
    interactive: {
      hover: "hover:bg-gray-50 dark:hover:bg-gray-700",
      focus: "focus:ring-blue-500 dark:focus:ring-blue-400",
      active: "active:bg-gray-100 dark:active:bg-gray-600",
      disabled: "opacity-50 cursor-not-allowed",
    },

    // Status colors
    status: {
      success: "text-green-600 dark:text-green-400",
      warning: "text-yellow-600 dark:text-yellow-400",
      error: "text-red-600 dark:text-red-400",
      info: "text-blue-600 dark:text-blue-400",
    },

    // Background status colors
    statusBg: {
      success: "bg-green-50 dark:bg-green-900/20",
      warning: "bg-yellow-50 dark:bg-yellow-900/20",
      error: "bg-red-50 dark:bg-red-900/20",
      info: "bg-blue-50 dark:bg-blue-900/20",
    },
  };

  // Common component classes
  const components = {
    card: `${colors.background.card} ${colors.border.primary} border rounded-lg shadow-sm`,
    cardHover: `${colors.background.card} ${colors.border.primary} border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`,
    button: {
      primary:
        "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
      secondary:
        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
      outline:
        "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
      ghost:
        "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
    },
    input: `${colors.background.card} ${colors.border.secondary} border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${colors.text.primary} placeholder-gray-500 dark:placeholder-gray-400`,
    modal: `${colors.background.modal} ${colors.border.primary} border rounded-lg shadow-xl`,
    dropdown: `${colors.background.card} ${colors.border.primary} border rounded-md shadow-lg`,
    tooltip: `${colors.background.card} ${colors.border.primary} border rounded-md shadow-lg ${colors.text.primary}`,
  };

  // Gradient classes
  const gradients = {
    primary:
      "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800",
    secondary:
      "bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700",
    accent:
      "bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
    success:
      "bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700",
    warning:
      "bg-gradient-to-r from-yellow-500 to-orange-600 dark:from-yellow-600 dark:to-orange-700",
    error:
      "bg-gradient-to-r from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700",
  };

  // Utility functions
  const getColorClass = (type, variant) => {
    return colors[type]?.[variant] || "";
  };

  const getComponentClass = (component, variant) => {
    return components[component]?.[variant] || components[component] || "";
  };

  const getGradientClass = (variant) => {
    return gradients[variant] || "";
  };

  // Theme-aware conditional classes
  const conditionalClasses = (lightClass, darkClass) => {
    return isDarkMode ? darkClass : lightClass;
  };

  // Debug utilities
  const debugInfo = {
    isDarkMode,
    theme,
    isLoaded,
    htmlClass:
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : false,
    bodyClass:
      typeof document !== "undefined"
        ? document.body.classList.contains("dark-theme")
        : false,
  };

  return {
    isDarkMode,
    theme,
    isLoaded,
    colors,
    components,
    gradients,
    getColorClass,
    getComponentClass,
    getGradientClass,
    conditionalClasses,
    debugInfo,
  };
};
