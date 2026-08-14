const ENTITY_MAP: Record<string, string> = {
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
};

function decode(raw: string) {
  return raw.replace(/&quot;|&apos;|&#39;|&amp;|&lt;|&gt;/g, (m) => ENTITY_MAP[m]);
}

function stripCdata(raw: string) {
  const match = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return match ? match[1] : raw;
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return decode(stripCdata((match?.[1] ?? "").trim()));
}

export type NewsArticle = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

function parseItems(xml: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml))) {
    const block = match[1];
    const source = extractTag(block, "source");
    let title = extractTag(block, "title");
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3));
    }
    items.push({
      title,
      link: extractTag(block, "link"),
      pubDate: extractTag(block, "pubDate"),
      source,
    });
  }
  return items;
}

async function fetchRss(url: string, limit: number): Promise<NewsArticle[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalDashboard/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google News RSS error: ${res.status}`);
  const xml = await res.text();
  return parseItems(xml).slice(0, limit);
}

export function fetchTopStories(limit = 8) {
  return fetchRss("https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko", limit);
}

export function searchNews(query: string, limit = 8) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  return fetchRss(url, limit);
}
