import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export const RootLayout = ({ children }) => {
    const { isDarkMode, isLoaded } = useTheme();
    const location = useLocation();
    
    // Define auth routes where theme should not be applied
    const authRoutes = ['/login', '/signup'];
    const isAuthPage = authRoutes.includes(location.pathname);

    // Apply theme classes to body element for global coverage, except on auth pages
    React.useEffect(() => {
        if (!isLoaded) return;

        const body = document.body;

        // Remove any existing theme classes
        body.classList.remove('light-theme', 'dark-theme');

        // Add current theme class only if not on an auth page
        if (!isAuthPage) {
            if (isDarkMode) {
                body.classList.add('dark-theme');
            } else {
                body.classList.add('light-theme');
            }
        } else {
            // For auth pages, always use light theme
            body.classList.add('light-theme');
        }    }, [isDarkMode, isLoaded, isAuthPage, location.pathname]);

    return (
        <div
            className={`
                min-h-screen w-full
                flex flex-col
                ${!isAuthPage ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100' : 'bg-white text-gray-900'}
                transition-colors duration-300
                ${isLoaded ? 'theme-loaded' : 'theme-loading'}
                box-border
            `}
            style={{ minHeight: '100dvh' }}
        >
            {children}
        </div>
    );
};