import { getSupabaseAdmin } from "./supabaseAdmin";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export type CalendarEvent = {
  id: string;
  summary: string;
  start: string; // ISO, date 또는 date-time
  end: string;
  allDay: boolean;
};

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data } = await admin
    .from("google_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.refresh_token) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.access_token as string;
}

export async function listUpcomingEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const url = `${CALENDAR_EVENTS_URL}?timeMin=${encodeURIComponent(timeMin.toISOString())}&timeMax=${encodeURIComponent(timeMax.toISOString())}&singleEvents=true&orderBy=startTime`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error("구글 캘린더 일정을 가져오지 못했습니다.");
  const json = await res.json();

  return (json.items ?? []).map((item: Record<string, unknown>) => {
    const start = item.start as { date?: string; dateTime?: string };
    const end = item.end as { date?: string; dateTime?: string };
    return {
      id: item.id as string,
      summary: (item.summary as string) ?? "(제목 없음)",
      start: start.dateTime ?? start.date ?? "",
      end: end.dateTime ?? end.date ?? "",
      allDay: !start.dateTime,
    };
  });
}

export async function createEvent(
  accessToken: string,
  { summary, start, end }: { summary: string; start: string; end: string }
): Promise<void> {
  const res = await fetch(CALENDAR_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary,
      start: { dateTime: start },
      end: { dateTime: end },
    }),
  });
  if (!res.ok) throw new Error("일정을 추가하지 못했습니다.");
}
