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
        if ('geolocation' in navigator) {
            // Single location fetch with standard accuracy
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
                (error) => {
                    let friendlyError = error;
                    if (error.code === 1) {
                        friendlyError = new Error('Location permission denied. Please allow location access.');
                    } else if (error.code === 2) {
                        friendlyError = new Error('Location unavailable. Please check your device settings.');
                    } else if (error.code === 3) {
                        friendlyError = new Error('Location request timed out. Please try again.');
                    }
                    console.error('Location error:', error);
                    setError(friendlyError);
                    setLoading(false);
                },
                {
                    enableHighAccuracy: false, // Standard accuracy for simplicity
                    timeout: 10000, // 10 second timeout
                    maximumAge: 300000, // Allow cached position up to 5 minutes old
                }
            );
        } else {
            setError(new Error('Geolocation is not supported by this browser.'));
            setLoading(false);
        }
    }, [refreshTrigger]);

    return { location, loading, error, accuracy, locationDetails, refreshLocation };
};