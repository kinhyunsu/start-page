"use client";

import { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { describeWeatherCode } from "@/lib/weatherCodes";
import WidgetCard from "./WidgetCard";

const CACHE_KEY = "dashboard-weather";
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

type WeatherReading = {
  temperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  fetchedAt: string;
};

async function fetchWeather(lat: number, lon: number): Promise<WeatherReading> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("날씨 정보를 가져오지 못했습니다.");
  const data = await res.json();
  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    fetchedAt: new Date().toISOString(),
  };
}

export default function WeatherWidget() {
  const location = useGeolocation();
  const [reading, setReading] = useState<WeatherReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setReading(JSON.parse(cached));
      } catch {
        // ignore malformed cache
      }
    }
  }, []);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchWeather(location!.lat, location!.lon);
        if (cancelled) return;
        setReading(data);
        setError(null);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        if (!cancelled) setError("날씨 정보를 가져오지 못했습니다.");
      }
    }

    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [location]);

  return (
    <WidgetCard title="날씨">
      {error && !reading && <p className="text-sm text-red-500">{error}</p>}
      {!error && !reading && <p className="text-sm text-ink-faint">불러오는 중...</p>}
      {reading && (
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{describeWeatherCode(reading.weatherCode).icon}</span>
            <div>
              <p className="font-mono text-3xl font-semibold tabular-nums text-ink">
                {Math.round(reading.temperature)}°C
              </p>
              <p className="text-sm text-ink-soft">{describeWeatherCode(reading.weatherCode).label}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            {location?.city} · 습도 {reading.humidity}% · 풍속 {reading.windSpeed}m/s
          </p>
        </div>
      )}
    </WidgetCard>
  );
}
