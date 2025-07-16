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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/20 dark:bg-dark-50/20 backdrop-blur-lg backdrop-saturate-150 border-t border-white/20 dark:border-white/10 shadow-lg z-40 m-0 p-1 xs:p-2 sm:p-2 md:p-3">
      <div className="flex justify-between items-center mx-auto w-full px-1 xs:px-2 sm:px-3 md:px-4 py-0 m-0">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center m-1 p-1 xs:p-2 sm:p-3 md:p-4 rounded-xl xs:rounded-2xl transition-all duration-300 ease-out focus:outline-none 
                w-12 h-12 xs:w-16 xs:h-14 sm:w-20 sm:h-16 md:w-24 md:h-20 lg:w-28 lg:h-24 
                justify-center flex-1 max-w-[15%] xs:max-w-[16%] sm:max-w-none ${
                isActive
                  ? "bg-white/30 dark:bg-white/10 text-primary-300 dark:text-primary-100 shadow-lg backdrop-blur-sm border border-white/30 dark:border-white/20"
                  : "text-primary-200 dark:text-primary-100/60 hover:text-primary-300 dark:hover:text-primary-100 hover:bg-white/20 dark:hover:bg-white/10 hover:backdrop-blur-sm hover:border hover:border-white/20 dark:hover:border-white/10"
              }`}
              aria-label={label}
            >
              <Icon size={16} className="w-5 h-5 drop-shadow-sm" />
              <span className="text-[8px] xs:text-[9px] sm:text-xs md:text-sm lg:text-base mt-0.5 xs:mt-1 font-medium hidden md:block drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full p-1">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
