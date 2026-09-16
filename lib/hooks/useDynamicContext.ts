'use client';

import { useState, useEffect, useCallback } from 'react';
import { DynamicUserContext } from '@/lib/types';

export function useDynamicContext() {
  const [context, setContext] = useState<DynamicUserContext>({
    userName: 'Fred',
    userLocation: 'Kampala, Uganda',
    userTimezone: 'Africa/Kampala',
    currentTime: '',
  });

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Initialize and update time dynamically
  const updateDynamicInfo = useCallback(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Kampala';
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    });

    setContext((prev) => {
      // Check if user set custom name/location in localStorage
      let savedName = prev.userName;
      let savedLoc = prev.userLocation;
      if (typeof window !== 'undefined') {
        const storedName = localStorage.getItem('nexa_user_name');
        const storedLoc = localStorage.getItem('nexa_user_location');
        if (storedName) savedName = storedName;
        if (storedLoc) savedLoc = storedLoc;
      }

      return {
        ...prev,
        userName: savedName,
        userLocation: savedLoc,
        userTimezone: tz,
        currentTime: timeFormatted,
      };
    });
  }, []);

  useEffect(() => {
    updateDynamicInfo();
    const timer = setInterval(updateDynamicInfo, 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, [updateDynamicInfo]);

  // Dynamic Browser Geolocation
  const requestLiveLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode using Open-Meteo or BigDataCloud client-safe API
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const cityName = data.city || data.locality || data.principalSubdivision || 'Detected Location';
            const country = data.countryName || '';
            const locationStr = country ? `${cityName}, ${country}` : cityName;

            setContext((prev) => ({
              ...prev,
              userLocation: locationStr,
              coordinates: { latitude, longitude },
            }));

            if (typeof window !== 'undefined') {
              localStorage.setItem('nexa_user_location', locationStr);
            }
          } else {
            setContext((prev) => ({
              ...prev,
              coordinates: { latitude, longitude },
            }));
          }
        } catch {
          setContext((prev) => ({
            ...prev,
            coordinates: { latitude, longitude },
          }));
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoError(err.message);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  const updateProfile = useCallback((name: string, location?: string) => {
    setContext((prev) => ({
      ...prev,
      userName: name,
      userLocation: location || prev.userLocation,
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexa_user_name', name);
      if (location) localStorage.setItem('nexa_user_location', location);
    }
  }, []);

  return {
    context,
    isLocating,
    geoError,
    requestLiveLocation,
    updateProfile,
    refreshContext: updateDynamicInfo,
  };
}
