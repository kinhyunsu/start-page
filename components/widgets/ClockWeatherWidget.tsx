"use client";

import { useEffect, useState } from "react";
import { useClock } from "@/hooks/useClock";
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

export default function ClockWeatherWidget() {
  const now = useClock();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const location = useGeolocation();
  const [reading, setReading] = useState<WeatherReading | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

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
        setWeatherError(null);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        if (!cancelled) setWeatherError("날씨 정보를 가져오지 못했습니다.");
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
    <WidgetCard title="오늘">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline gap-2">
          {now ? (
            <>
              <p className="font-mono text-3xl font-semibold tabular-nums text-ink">
                {now.toLocaleTimeString("ko-KR", { hour12: false })}
              </p>
              <p className="text-xs text-ink-faint">
                {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} ·{" "}
                {timeZone}
              </p>
            </>
          ) : (
            <p className="font-mono text-3xl font-semibold text-ink-faint">--:--:--</p>
          )}
        </div>

        <div className="h-px w-full bg-border" />

        <div className="flex items-baseline gap-2">
          {weatherError && !reading && <p className="text-xs text-red-500">{weatherError}</p>}
          {!weatherError && !reading && <p className="text-xs text-ink-faint">불러오는 중</p>}
          {reading && (
            <>
              <p className="flex items-baseline gap-1 font-mono text-2xl font-semibold tabular-nums text-ink">
                <span className="text-base">{describeWeatherCode(reading.weatherCode).icon}</span>
                {Math.round(reading.temperature)}°C
              </p>
              <p className="text-xs text-ink-faint">
                {describeWeatherCode(reading.weatherCode).label} · {location?.city}
              </p>
            </>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
