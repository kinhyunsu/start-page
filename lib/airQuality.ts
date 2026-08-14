export type AirQualityReading = {
  pm10: number;
  pm25: number;
  fetchedAt: string;
};

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityReading> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("대기질 정보를 가져오지 못했습니다.");
  const data = await res.json();
  return {
    pm10: data.current.pm10,
    pm25: data.current.pm2_5,
    fetchedAt: new Date().toISOString(),
  };
}

// 한국 통합대기환경지수(CAI) 간이 등급 — PM10/PM2.5 중 더 나쁜 쪽 등급을 취한다.
function gradeOf(value: number, breakpoints: [number, number, number]) {
  if (value <= breakpoints[0]) return 0; // 좋음
  if (value <= breakpoints[1]) return 1; // 보통
  if (value <= breakpoints[2]) return 2; // 나쁨
  return 3; // 매우나쁨
}

const LABELS = ["좋음", "보통", "나쁨", "매우나쁨"] as const;
const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444"] as const;

export function describeAirQuality(reading: AirQualityReading) {
  const grade = Math.max(gradeOf(reading.pm10, [30, 80, 150]), gradeOf(reading.pm25, [15, 35, 75]));
  return { label: LABELS[grade], color: COLORS[grade] };
}
