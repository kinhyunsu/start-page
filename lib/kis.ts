import { getSupabaseAdmin } from "./supabaseAdmin";

const KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";
const TOKEN_CACHE_ROW_ID = 1;
const EXPIRY_SAFETY_MARGIN_MS = 10 * 60 * 1000;

function getKisCredentials() {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;
  if (!appKey || !appSecret) return null;
  return { appKey, appSecret };
}

export function isKisConfigured() {
  return getKisCredentials() !== null;
}

async function issueKisToken(appKey: string, appSecret: string) {
  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: appKey,
      appsecret: appSecret,
    }),
  });
  if (!res.ok) throw new Error("KIS 토큰 발급에 실패했습니다.");
  const data = await res.json();
  return { accessToken: data.access_token as string, expiresInSec: data.expires_in as number };
}

async function getKisAccessToken(forceRefresh = false): Promise<string> {
  const credentials = getKisCredentials();
  if (!credentials) throw new Error("KIS_APP_KEY / KIS_APP_SECRET이 설정되지 않았습니다.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");

  if (!forceRefresh) {
    const { data } = await admin
      .from("kis_token_cache")
      .select("access_token, expires_at")
      .eq("id", TOKEN_CACHE_ROW_ID)
      .maybeSingle();

    if (data && new Date(data.expires_at).getTime() - Date.now() > EXPIRY_SAFETY_MARGIN_MS) {
      return data.access_token;
    }
  }

  const { accessToken, expiresInSec } = await issueKisToken(credentials.appKey, credentials.appSecret);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

  await admin.from("kis_token_cache").upsert({
    id: TOKEN_CACHE_ROW_ID,
    access_token: accessToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return accessToken;
}

async function requestKisPrice(ticker: string, accessToken: string) {
  const credentials = getKisCredentials()!;
  const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${ticker}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
      appkey: credentials.appKey,
      appsecret: credentials.appSecret,
      tr_id: "FHKST01010100",
    },
    cache: "no-store",
  });
  return res;
}

export async function fetchKisPrice(ticker: string): Promise<number> {
  let token = await getKisAccessToken();
  let res = await requestKisPrice(ticker, token);

  if (res.status === 401) {
    token = await getKisAccessToken(true);
    res = await requestKisPrice(ticker, token);
  }

  if (!res.ok) throw new Error(`KIS 시세 조회 실패: ${ticker}`);

  const data = await res.json();
  const price = Number(data?.output?.stck_prpr);
  if (!Number.isFinite(price)) throw new Error(`KIS 응답 형식 오류: ${ticker}`);
  return price;
}
