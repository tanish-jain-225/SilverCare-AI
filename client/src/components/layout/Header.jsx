import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, Globe, ChevronDown, LogOut, User } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ThemeToggle } from "../ui/ThemeToggle";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useApp();

  const handleLogout = () => {
    // Reset Theme and icon - this will ensure the theme is set to light on logout and the icon is set to moon
    // Give a small delay to ensure the theme is set before logging out - sleep is not recommended, but here we use a timeout to ensure the theme is set
    setTimeout(() => {
      document.documentElement.classList.remove("dark"); // Remove dark class
      document.documentElement.classList.add("light"); // Add light class
      document.documentElement.style.setProperty("--theme-color", "#ffffff"); // Reset theme color to light
      document.documentElement.style.setProperty("--theme-icon", "moon"); // Reset theme icon to moon with Light theme
    }, 1000); // Reset theme to light before actually logging out - 1 second delay

    // Call logout function from context
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const navigateAndClose = (path) => {
    setIsMenuOpen(false);
    setTimeout(() => navigate(path), 50);
  };

  const handleMenuLinkClick = () => setIsMenuOpen(false);

  // Add effect to close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      // Only handle click outside for desktop view (md and above)
      if (
        window.innerWidth >= 768 &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-white dark:bg-dark-50 shadow-lg dark:shadow-dark-100/20 w-full sticky top-0 z-50 border-b border-primary-100/20 dark:border-dark-600/20 m-0 p-1 xs:p-2 sm:p-2 md:p-3">
      <div className="w-full flex items-center justify-between px-1 xs:px-2 sm:px-3 md:px-4 lg:px-6 py-0 m-0">
        {/* Logo and Brand */}
        <Link
          to="/home"
          className="flex items-center gap-1 xs:gap-2 focus:outline-none rounded-lg p-1 xs:p-1.5 sm:p-2 transition-all hover:scale-105"
        >
          <img
            src="/voice-search.png"
            alt="SilverCareAI Logo"
            className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12"
          />
          <span className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary-300 dark:text-primary-100 tracking-tight">
            <span className="hidden xs:inline">SilverCareAI</span>
            <span className="xs:hidden">Silver</span>
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-primary-300 dark:text-primary-100 focus:outline-none rounded-lg p-1.5 xs:p-2 sm:p-2 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          {isMenuOpen ? <X size={20} className="xs:w-6 xs:h-6 sm:w-6 sm:h-6" /> : <Menu size={20} className="xs:w-6 xs:h-6 sm:w-6 sm:h-6" />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-6">
          <div className="flex items-center gap-1 md:gap-2 lg:gap-3 xl:gap-4">
            <Link
              to="/home"
              className="text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium rounded-lg px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 text-sm md:text-base lg:text-lg"
            >
              Home
            </Link>
            <Link
              to="/emergency"
              className="text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium rounded-lg px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 text-sm md:text-base lg:text-lg"
            >
              <span className="hidden lg:inline">Emergency</span>
              <span className="lg:hidden">Emergency</span>
            </Link>
            <Link
              to="/reminders"
              className="text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium rounded-lg px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 text-sm md:text-base lg:text-lg"
            >
              <span className="hidden lg:inline">Reminders</span>
              <span className="lg:hidden">Reminders</span>
            </Link>
            <Link
              to="/ask-queries"
              className="text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium rounded-lg px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 text-sm md:text-base lg:text-lg"
            >
              <span className="hidden lg:inline">Ask</span>
              <span className="lg:hidden">Ask</span>
            </Link>
            <Link
              to="/blog"
              className="text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium rounded-lg px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 text-sm md:text-base lg:text-lg"
            >
              Blog
            </Link>
          </div>

          <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative flex items-center" ref={menuRef}>
                <button
                  className="flex items-center gap-1 md:gap-2 text-primary-300 dark:text-primary-100 font-medium hover:text-primary-200 dark:hover:text-primary-100 focus:outline-none rounded-lg px-1 md:px-2 lg:px-3 py-1.5 md:py-2 transition-all hover:bg-primary-100/10 dark:hover:bg-primary-100/10"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  {user.profilePicture && user.profilePicture.data ? (
                    <img
                      src={user.profilePicture.data}
                      alt="Profile"
                      className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-primary-200 dark:border-primary-100 shadow-sm"
                    />
                  ) : user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-primary-200 dark:border-primary-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full bg-primary-100/20 dark:bg-primary-100/10 flex items-center justify-center text-primary-200 dark:text-primary-100 font-bold border border-primary-200/30 dark:border-primary-100/20">
                      <User size={16} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                    </div>
                  )}
                  <ChevronDown
                    size={14}
                    className="md:w-4 md:h-4 lg:w-5 lg:h-5 transition-transform duration-200"
                    style={{
                      transform: isMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 md:w-48 lg:w-52 rounded-xl shadow-lg bg-white dark:bg-dark-50 py-2 z-50 border border-primary-100/20 dark:border-dark-600/20">
                    <button
                      className="block w-full text-left px-3 md:px-4 py-2 text-sm md:text-base text-primary-300 dark:text-primary-100 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 hover:text-primary-400 dark:hover:text-primary-200 rounded-lg mx-1 transition-all"
                      onClick={() => navigateAndClose("/profile")}
                    >
                      Profile
                    </button>
                    <button
                      className="block w-full text-left px-3 md:px-4 py-2 text-sm md:text-base text-primary-300 dark:text-primary-100 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 dark:hover:text-red-500 hover:text-red-500 rounded-lg mx-1 transition-all"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white dark:bg-dark-50 shadow-lg rounded-b-xl py-3 xs:py-4 px-3 xs:px-4 sm:px-6 border-t border-primary-100/20 dark:border-dark-600/20">
          <ul className="space-y-2 xs:space-y-3 sm:space-y-4">
            <li>
              <Link
                to="/home"
                className="block text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium px-2 xs:px-3 py-2 xs:py-2.5 rounded-lg text-sm xs:text-base"
                onClick={handleMenuLinkClick}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/emergency"
                className="block text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium px-2 xs:px-3 py-2 xs:py-2.5 rounded-lg text-sm xs:text-base"
                onClick={handleMenuLinkClick}
              >
                Emergency
              </Link>
            </li>
            <li>
              <Link
                to="/reminders"
                className="block text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium px-2 xs:px-3 py-2 xs:py-2.5 rounded-lg text-sm xs:text-base"
                onClick={handleMenuLinkClick}
              >
                Reminders
              </Link>
            </li>
            <li>
              <Link
                to="/ask-queries"
                className="block text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium px-2 xs:px-3 py-2 xs:py-2.5 rounded-lg text-sm xs:text-base"
                onClick={handleMenuLinkClick}
              >
                Ask
              </Link>
            </li>
            <li>
              <Link
                to="/blog"
                className="block text-primary-300 dark:text-primary-100 hover:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 transition-all font-medium px-2 xs:px-3 py-2 xs:py-2.5 rounded-lg text-sm xs:text-base"
                onClick={handleMenuLinkClick}
              >
                Blog
              </Link>
            </li>
            <li>
              <button
                className="block w-full text-left text-primary-300 dark:text-primary-100 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 hover:text-primary-400 dark:hover:text-primary-200 py-2 xs:py-2.5 px-2 xs:px-3 font-medium rounded-lg text-sm xs:text-base transition-all"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/profile");
                }}
              >
                Profile
              </button>
            </li>
            <li>
              <button
                className="block w-full text-left text-primary-300 dark:text-primary-100 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 hover:text-red-500 dark:hover:text-red-500 py-2 xs:py-2.5 px-2 xs:px-3 font-medium rounded-lg text-sm xs:text-base transition-all"
                onClick={handleLogout}
              >
                Logout
              </button>
            </li>
            <li className="flex items-center gap-2 p-1 xs:p-2">
              {/* Toggle  */}
              <ThemeToggle className="w-full text-left text-primary-300 dark:text-primary-100 hover:bg-primary-100/10 dark:hover:bg-primary-100/10 py-1 xs:py-1.5 px-1 xs:px-2 text-sm xs:text-base font-medium rounded-full transition-all" />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
