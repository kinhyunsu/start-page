const ENTITY_MAP: Record<string, string> = {
  "&quot;": '"',
  "&apos;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
};

function cleanText(raw: string) {
  return raw
    .replace(/<\/?b>/g, "")
    .replace(/&quot;|&apos;|&amp;|&lt;|&gt;/g, (m) => ENTITY_MAP[m]);
}

function extractSource(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export type NewsArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
};

type NaverNewsItem = {
  title: string;
  description: string;
  link: string;
  originallink: string;
  pubDate: string;
};

export async function searchNews(query: string, display = 8): Promise<NewsArticle[] | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    query
  )}&display=${display}&sort=date`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Naver News API error: ${res.status}`);

  const data = (await res.json()) as { items: NaverNewsItem[] };
  return data.items.map((item) => {
    const link = item.originallink || item.link;
    return {
      title: cleanText(item.title),
      description: cleanText(item.description),
      link,
      pubDate: item.pubDate,
      source: extractSource(link),
    };
  });
}
