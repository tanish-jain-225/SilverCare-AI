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
    <nav className="fixed bottom-0 w-full bg-white/20 dark:bg-dark-50/20 backdrop-blur-lg backdrop-saturate-150 z-40 p-1">
      <div className="flex justify-between items-center mx-auto w-full p-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`
                relative flex flex-col items-center justify-center 
                m-1 p-1 xs:p-2 sm:p-3 md:p-4 
                w-12 h-12 xs:w-16 xs:h-14 sm:w-20 sm:h-16 md:w-24 md:h-20 lg:w-28 lg:h-24 
                flex-1 max-w-[15%] xs:max-w-[16%] sm:max-w-none
                rounded-xl xs:rounded-2xl 
                transition-all duration-300 ease-out 
                transform hover:scale-105
                ${
                  isActive
                    ? `
                      bg-gradient-to-br from-blue-500/20 to-purple-500/20 
                      dark:from-blue-400/15 dark:to-purple-400/15
                      text-blue-600 dark:text-blue-300
                      shadow-lg shadow-blue-500/20 dark:shadow-blue-400/10
                      backdrop-blur-md border-2 border-blue-500/30 dark:border-blue-400/20
                      ring-2 ring-blue-500/10 dark:ring-blue-400/10
                      before:absolute before:inset-0 before:rounded-xl before:xs:rounded-2xl 
                      before:bg-gradient-to-r before:from-blue-500/5 before:to-purple-500/5
                      before:dark:from-blue-400/3 before:dark:to-purple-400/3
                    `
                    : `
                      text-slate-600 dark:text-slate-300
                      hover:text-blue-600 dark:hover:text-blue-300
                      hover:bg-gradient-to-br hover:from-slate-100/80 hover:to-slate-200/60
                      dark:hover:from-slate-700/40 dark:hover:to-slate-600/30
                      hover:shadow-md hover:shadow-slate-500/10 dark:hover:shadow-slate-400/5
                      hover:backdrop-blur-sm hover:border hover:border-slate-300/40 
                      dark:hover:border-slate-600/30
                      hover:ring-1 hover:ring-slate-400/20 dark:hover:ring-slate-500/20
                    `
                }
                group overflow-hidden
              `}
              aria-label={label}
            >
              {/* Icon with enhanced styling */}
              <Icon 
                size={16} 
                className={`
                  w-5 h-5 transition-all duration-300 drop-shadow-sm
                  ${isActive ? 'drop-shadow-md' : 'group-hover:drop-shadow-md'}
                `} 
              />
              
              {/* Label with better contrast and readability */}
              <span 
                className={`
                  text-[8px] xs:text-[9px] sm:text-xs md:text-sm lg:text-base 
                  mt-0.5 xs:mt-1 font-medium hidden md:block 
                  whitespace-nowrap overflow-hidden text-ellipsis max-w-full
                  px-1 py-0.5 transition-all duration-300
                  ${isActive 
                    ? 'drop-shadow-md text-blue-700 dark:text-blue-200' 
                    : 'drop-shadow-sm group-hover:drop-shadow-md group-hover:text-blue-600 dark:group-hover:text-blue-300'
                  }
                `}
              >
                {label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full shadow-sm animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
