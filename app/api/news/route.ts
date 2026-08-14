import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchTopStories, searchNews, type NewsArticle } from "@/lib/googleNews";

type GameArticle = NewsArticle & { game: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (category === "politics" || category === "hot") {
    try {
      const articles = category === "politics" ? await searchNews("정치") : await fetchTopStories();
      return NextResponse.json({ articles });
    } catch {
      return NextResponse.json({ error: "뉴스를 가져오지 못했습니다." }, { status: 500 });
    }
  }

  if (category === "games") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { data: games } = await supabase
      .from("tracked_games")
      .select("name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const gameNames = (games ?? []).map((g) => g.name as string);
    if (gameNames.length === 0) {
      return NextResponse.json({ games: [], articles: [] });
    }

    try {
      const results = await Promise.all(
        gameNames.map(async (name) => ({
          name,
          articles: await searchNews(`${name} 업데이트`, 4),
        }))
      );

      const articles: GameArticle[] = results.flatMap((r) =>
        r.articles.map((a) => ({ ...a, game: r.name }))
      );
      articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      return NextResponse.json({ games: gameNames, articles });
    } catch {
      return NextResponse.json({ error: "뉴스를 가져오지 못했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}
