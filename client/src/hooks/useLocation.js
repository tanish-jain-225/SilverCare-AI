import { useState, useEffect, useCallback } from 'react';

export const useLocation = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [locationDetails, setLocationDetails] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshLocation = useCallback(() => {
        setLoading(true);
        setError(null);
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        let watchId = null;
        let fallbackTimeout = null;
        
        if ('geolocation' in navigator) {
            // First try with high accuracy
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const coords = position.coords;
                    setLocation({
                        lat: coords.latitude,
                        lng: coords.longitude,
                    });
                    setAccuracy(coords.accuracy);
                    setLocationDetails({
                        accuracy: coords.accuracy,
                        altitude: coords.altitude,
                        altitudeAccuracy: coords.altitudeAccuracy,
                        heading: coords.heading,
                        speed: coords.speed,
                        timestamp: position.timestamp
                    });
                    setLoading(false);
                    setError(null);
                    
                    // Clear fallback timeout if we got a position
                    if (fallbackTimeout) {
                        clearTimeout(fallbackTimeout);
                        fallbackTimeout = null;
                    }
                },
                (error) => {
                    console.error('High accuracy location error:', error);
                    
                    // If high accuracy fails, try with lower accuracy as fallback
                    fallbackTimeout = setTimeout(() => {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const coords = position.coords;
                                setLocation({
                                    lat: coords.latitude,
                                    lng: coords.longitude,
                                });
                                setAccuracy(coords.accuracy);
                                setLocationDetails({
                                    accuracy: coords.accuracy,
                                    altitude: coords.altitude,
                                    altitudeAccuracy: coords.altitudeAccuracy,
                                    heading: coords.heading,
                                    speed: coords.speed,
                                    timestamp: position.timestamp
                                });
                                setLoading(false);
                                setError(null);
                            },
                            (fallbackError) => {
                                let friendlyError = fallbackError;
                                if (fallbackError.code === 1) {
                                    friendlyError = new Error('Location permission denied. Please allow location access.');
                                } else if (fallbackError.code === 2) {
                                    friendlyError = new Error('Location unavailable. Please check your device settings.');
                                } else if (fallbackError.code === 3) {
                                    friendlyError = new Error('Location request timed out. Please try refreshing or check your connection.');
                                }
                                console.error('Fallback location error:', fallbackError);
                                setError(friendlyError);
                                setLoading(false);
                            },
                            {
                                enableHighAccuracy: false, // Lower accuracy for fallback
                                timeout: 10000,
                                maximumAge: 60000, // Allow older cached position
                            }
                        );
                    }, 2000); // Wait 2 seconds before trying fallback
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000, // Reduced timeout to 15 seconds
                    maximumAge: 30000, // Allow cached position up to 30 seconds old
                }
            );
        } else {
            setError(new Error('Geolocation is not supported by this browser.'));
            setLoading(false);
        }

        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (fallbackTimeout) {
                clearTimeout(fallbackTimeout);
            }
        };
    }, [refreshTrigger]);

    return { location, loading, error, accuracy, locationDetails, refreshLocation };
};