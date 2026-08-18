export function nextBillingDate(billingDay: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const clampedThis = Math.min(billingDay, daysInThisMonth);
  if (today <= clampedThis) return new Date(year, month, clampedThis);

  const daysInNextMonth = new Date(year, month + 2, 0).getDate();
  return new Date(year, month + 1, Math.min(billingDay, daysInNextMonth));
}

export function daysUntil(date: Date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - startOfToday.getTime()) / 86400000);
}

export function formatMoney(amount: number, currency: "KRW" | "USD" = "KRW") {
  const symbol = currency === "KRW" ? "₩" : "$";
  return `${symbol}${new Intl.NumberFormat("ko-KR").format(amount)}`;
}

export function formatBillingLabel(date: Date, dLeft: number) {
  const md = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  if (dLeft === 0) return `오늘 결제 (${md})`;
  if (dLeft === 1) return `내일 결제 (${md})`;
  return `${md} 결제 · D-${dLeft}`;
}
