"use client";

import { useEffect, useState } from "react";

const SEOUL = { lat: 37.5665, lon: 126.978, city: "서울" };
const CACHE_KEY = "dashboard-location";

export type Location = {
  lat: number;
  lon: number;
  city: string;
  source: "geolocation" | "fallback";
};

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setLocation(JSON.parse(cached));
      } catch {
        // ignore malformed cache
      }
    }

    if (!("geolocation" in navigator)) {
      const fallback: Location = { ...SEOUL, source: "fallback" };
      setLocation(fallback);
      localStorage.setItem(CACHE_KEY, JSON.stringify(fallback));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const resolved: Location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          city: "현재 위치",
          source: "geolocation",
        };
        setLocation(resolved);
        localStorage.setItem(CACHE_KEY, JSON.stringify(resolved));
      },
      () => {
        const fallback: Location = { ...SEOUL, source: "fallback" };
        setLocation(fallback);
        localStorage.setItem(CACHE_KEY, JSON.stringify(fallback));
      },
      { timeout: 8000 }
    );
  }, []);

  return location;
}
