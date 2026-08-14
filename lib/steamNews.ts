import type { NewsArticle } from "./googleNews";

type StoreSearchResult = { items: { id: number; name: string }[] };

async function findAppId(name: string): Promise<number | null> {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
    name
  )}&l=korean&cc=kr`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as StoreSearchResult;
  return data.items?.[0]?.id ?? null;
}

type SteamNewsResponse = {
  appnews: { newsitems: { title: string; url: string; date: number }[] };
};

async function fetchNewsForApp(appid: number, limit: number): Promise<NewsArticle[]> {
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=${limit}&maxlength=0&format=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as SteamNewsResponse;
  return (data.appnews?.newsitems ?? []).map((item) => ({
    title: item.title,
    link: item.url,
    pubDate: new Date(item.date * 1000).toISOString(),
    source: "Steam",
  }));
}

// 스팀에 있는 게임이면 공식 스팀 뉴스/패치노트를 반환하고, 없으면 null (호출부에서 뉴스 검색으로 대체)
export async function fetchOfficialSteamUpdates(
  gameName: string,
  limit = 4
): Promise<NewsArticle[] | null> {
  const appid = await findAppId(gameName);
  if (!appid) return null;
  const articles = await fetchNewsForApp(appid, limit);
  return articles.length > 0 ? articles : null;
}
