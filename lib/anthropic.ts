import Anthropic from "@anthropic-ai/sdk";
import type { PricedHolding } from "./portfolio";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function isAnthropicConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function generatePortfolioInsight(holdings: PricedHolding[]): Promise<string> {
  const summaryLines = holdings
    .filter((h) => h.gainLossPercent !== null)
    .map((h) => `${h.symbol} (${h.asset_type}): 수익률 ${h.gainLossPercent!.toFixed(1)}%`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 300,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    messages: [
      {
        role: "user",
        content: `다음은 보유 종목별 수익률입니다:\n${summaryLines}\n\n이 보유 종목들을 한국어로 짧은 한 문단(3~4문장)으로 요약하고, 특별히 눈에 띄는 변동(큰 수익 또는 손실)이 있으면 짚어주세요. 투자 조언이나 매매 추천은 하지 마세요.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}
