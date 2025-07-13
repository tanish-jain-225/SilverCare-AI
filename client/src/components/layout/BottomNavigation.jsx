import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Mic, User, BookText, Bell, AlertTriangle } from "lucide-react";

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: AlertTriangle, label: "Emergency", path: "/emergency" },
    { icon: Bell, label: "Reminders", path: "/reminders" },
    { icon: Mic, label: "Voice Assistant", path: "/ask-queries" },
    { icon: BookText, label: "Blog", path: "/blog" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-50 shadow-sm z-40 m-0 p-2">
      <div className="flex justify-between items-center max-w-2xl mx-auto w-full px-0 sm:px-0 py-0 m-0">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ease-out focus:outline-none w-20 h-16 sm:w-24 sm:h-20 justify-center ${
                isActive
                  ? "bg-primary-100/80 dark:bg-primary-100/20 text-primary-300 dark:text-primary-100 shadow-sm"
                  : "text-primary-200 dark:text-primary-100/60 hover:text-primary-300 dark:hover:text-primary-100 hover:bg-primary-100/60 dark:hover:bg-primary-100/10"
              }`}
              aria-label={label}
            >
              <Icon size={22} className="drop-shadow-sm" />
              <span className="text-xs mt-1 font-medium hidden sm:block drop-shadow-sm whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
