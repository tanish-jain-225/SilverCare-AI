import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ message = "Loading your healthcare assistant..." }) => {
    const [dots, setDots] = useState('');
    const [currentTip, setCurrentTip] = useState(0);

    // Animated dots effect
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000"
            role="status"
            aria-label="Loading screen"
        >
            {/* Dynamic animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-x"></div>
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute animate-float opacity-20 ${
                            i % 2 === 0 ? 'bg-blue-400' : 'bg-indigo-400'
                        } rounded-full`}
                        style={{
                            width: `${Math.random() * 6 + 4}px`,
                            height: `${Math.random() * 6 + 4}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${Math.random() * 3 + 4}s`
                        }}
                    />
                ))}
            </div>

            {/* Blur overlay with subtle pattern */}
            <div className="absolute inset-0 backdrop-blur-md bg-white/20"></div>

            {/* Main content container */}
            <div className="relative flex flex-col items-center space-y-8 p-8 max-w-md mx-auto">
                {/* Logo Container with Enhanced Animations */}
                <div className="relative group">
                    {/* Outer glow ring */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 rounded-full opacity-30 group-hover:opacity-50 animate-spin-slow blur-xl"></div>
                    
                    {/* Middle ring */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full opacity-50 animate-pulse"></div>
                    
                    {/* Logo container */}
                    <div className="relative h-28 w-28 rounded-full bg-white/90 p-5 shadow-2xl backdrop-blur-sm border border-white/50 hover:scale-105 transition-transform duration-500">
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
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse font-poppins tracking-tight">
                        SilverCare AI
                    </h1>
                    <p className="text-xl text-blue-700/80 font-medium font-poppins animate-fade-in-up">
                        Compassionate care through technology
                    </p>
                </div>

                {/* Advanced Loading Indicator */}
                <div className="w-full max-w-xs space-y-4">
                    {/* Progress bar */}
                    <div className="relative w-full h-2 bg-blue-100/80 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-loading-bar rounded-full shadow-lg"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                    
                    {/* Loading message */}
                    <div className="text-center">
                        <p className="text-blue-600 font-medium text-sm">
                            {message}{dots}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen; 