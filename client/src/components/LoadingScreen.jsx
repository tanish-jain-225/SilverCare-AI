import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ message = "Loading your healthcare assistant..." }) => {
    const [dots, setDots] = useState('');

    // Animated dots effect
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="fixed inset-0 z-70 flex flex-col min-h-0 min-w-0 transition-all duration-1000 bg-white/80 dark:bg-dark-100/80"
            role="status"
            aria-label="Loading screen"
        >
            {/* Dynamic animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-x pointer-events-none"></div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute animate-float opacity-20 ${
                            i % 2 === 0 ? 'bg-blue-400' : 'bg-indigo-400'
                        } rounded-full`}
                        style={{
                            width: `min(${Math.random() * 6 + 4}px, 6vw)`,
                            height: `min(${Math.random() * 6 + 4}px, 6vw)`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${Math.random() * 3 + 4}s`
                        }}
                    />
                ))}
            </div>

            {/* Blur overlay with subtle pattern */}
            <div className="absolute inset-0 backdrop-blur-md bg-white/20 pointer-events-none"></div>

            {/* Main content container, scrollable if needed */}
            <div className="relative flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 overflow-y-auto w-full">
                <div className="flex flex-col items-center justify-center w-full max-w-[98vw] sm:max-w-xs md:max-w-md px-2 py-6 sm:px-4 sm:py-8 my-4 sm:my-0">
                    {/* Logo Container with Enhanced Animations */}
                    <div className="relative group w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-2 sm:mb-4">
                        {/* Outer glow ring */}
                        <div className="absolute -inset-1 xs:-inset-2 sm:-inset-4 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 rounded-full opacity-30 group-hover:opacity-50 animate-spin-slow blur-xl"></div>
                        {/* Middle ring */}
                        <div className="absolute -inset-0.5 xs:-inset-1 sm:-inset-2 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full opacity-50 animate-pulse"></div>
                        {/* Logo container */}
                        <div className="relative h-12 w-12 xs:h-16 xs:w-16 sm:h-20 sm:w-20 rounded-full bg-white/90 p-1 xs:p-2 sm:p-3 shadow-2xl backdrop-blur-sm border border-white/50 hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                            <img 
                                src="/voice-search.png" 
                                alt="SilverCare AI Logo" 
                                className="w-full h-full object-contain animate-pulse"
                                loading="eager"
                                decoding="sync"
                            />
                        </div>
                    </div>

                    {/* Title with staggered animation */}
                    <div className="text-center space-y-1 sm:space-y-4 w-full">
                        <h1 className="font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse font-poppins tracking-tight break-words"
                            style={{ fontSize: 'clamp(1.1rem, 6vw, 2.2rem)' }}>
                            SilverCare AI
                        </h1>
                        <p className="text-blue-700/80 font-medium font-poppins break-words"
                            style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)' }}>
                            Compassionate care through technology
                        </p>
                    </div>

                    {/* Advanced Loading Indicator */}
                    <div className="w-full max-w-[98vw] sm:max-w-xs space-y-2 sm:space-y-4 mt-2">
                        {/* Progress bar */}
                        <div className="relative w-full h-2 bg-blue-100/80 rounded-full overflow-hidden backdrop-blur-sm shadow-inner min-w-[40px]">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-loading-bar rounded-full shadow-lg"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                        {/* Loading message */}
                        <div className="text-center">
                            <p className="text-blue-600 font-medium break-words" style={{ fontSize: 'clamp(0.8rem, 3vw, 1rem)' }}>
                                {message}{dots}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen; 