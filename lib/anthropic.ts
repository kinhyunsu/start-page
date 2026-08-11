import Anthropic from "@anthropic-ai/sdk";
import type { PricedHolding } from "./portfolio";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function isAnthropicConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function generateHoldingsNewsDigest(holdings: PricedHolding[]): Promise<string> {
  const items = holdings.map((h) => h.name ?? h.symbol);
  const itemList = items.map((name, i) => `${i + 1}. ${name}`).join("\n");

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    output_config: { effort: "high" },
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: Math.min(items.length * 2, 12),
      },
    ],
    messages: [
      {
        role: "user",
        content: `다음은 사용자가 보유한 주식/코인 종목입니다:\n${itemList}\n\n각 종목마다 웹 검색을 최소 1회 이상 수행해서 최근(가능하면 최근 2~3일 이내) 관련 뉴스나 글을 찾아주세요. 종목별로 소제목을 달고, 핵심 뉴스 1~2개를 "제목 - 한 줄 요약 (출처)" 형식으로 정리해 한국어로 보여주세요. 투자 조언이나 매매 추천은 하지 마세요. 특별한 뉴스가 없는 종목은 "특별한 뉴스 없음"이라고만 적어주세요.`,
      },
    ],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n");
}
