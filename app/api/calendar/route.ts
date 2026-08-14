import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getGoogleAccessToken, listUpcomingEvents, createEvent } from "@/lib/googleCalendar";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function seoulMidnight(daysFromToday: number) {
  const nowSeoul = new Date(Date.now() + KST_OFFSET_MS);
  const seoulMidnightAsUtc = Date.UTC(
    nowSeoul.getUTCFullYear(),
    nowSeoul.getUTCMonth(),
    nowSeoul.getUTCDate() + daysFromToday
  );
  return new Date(seoulMidnightAsUtc - KST_OFFSET_MS);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json({ needsConnect: true, events: [] });
  }

  try {
    const events = await listUpcomingEvents(accessToken, seoulMidnight(0), seoulMidnight(2));
    return NextResponse.json({ needsConnect: false, events });
  } catch {
    return NextResponse.json({ error: "일정을 가져오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json({ needsConnect: true }, { status: 409 });
  }

  const body = await request.json();
  const { summary, start, end } = body as { summary: string; start: string; end: string };
  if (!summary || !start || !end) {
    return NextResponse.json({ error: "제목/시작/종료 시간이 필요합니다." }, { status: 400 });
  }

  try {
    await createEvent(accessToken, { summary, start, end });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "일정을 추가하지 못했습니다." }, { status: 500 });
  }
}
