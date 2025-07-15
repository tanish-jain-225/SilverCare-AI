/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Primary colors 
        primary: {
          50: "#e6f4f9", // Lightest shade of light blue
          100: "#8ecae6", // Light blue
          200: "#219ebc", // Medium blue
          300: "#023047", // Dark blue
          400: "#ffb703", // Yellow
          500: "#fb8500", // Orange
          600: "#e67e00", // Darker orange
          700: "#d17700", // Even darker orange
          800: "#bc6b00", // Very dark orange
          900: "#a35f00", // Darkest orange
        },
        // Dark mode colors
        dark: {
          50: "#023047", // Dark blue as base
          100: "#1a3d4f",
          200: "#2d4a5c",
          300: "#405769",
          400: "#536476",
          500: "#667183",
          600: "#8ecae6", // Light blue for accents
          700: "#219ebc", // Medium blue for highlights
          800: "#ffb703", // Yellow for emphasis
          900: "#fb8500", // Orange for strong emphasis
        },
        // Background colors
        background: {
          light: "#ffffff",
          dark: "#023047", // Dark blue as dark mode background
        },
        // Surface colors
        surface: {
          light: "#ffffff",
          dark: "#1a3d4f", // Slightly lighter than background
        },
        // Text colors
        text: {
          light: {
            primary: "#023047", // Dark blue
            secondary: "#219ebc", // Medium blue
            tertiary: "#8ecae6", // Light blue
          },
          dark: {
            primary: "#ffffff", // White
            secondary: "#8ecae6", // Light blue
            tertiary: "#219ebc", // Medium blue
          },
        },
        // Accent colors
        accent: {
          yellow: "#ffb703",
          orange: "#fb8500",
        },
      },
      animation: {
        "theme-toggle": "theme-toggle 0.3s ease-in-out",
        "slide-in": "slide-in 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-delay': 'fadeIn 0.8s ease-out 0.3s forwards',
        'loading-bar': 'loadingBar 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        "theme-toggle": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        loadingBar: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionProperty: {
        colors:
          "color, background-color, border-color, text-decoration-color, fill, stroke",
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
