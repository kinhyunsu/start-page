import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "시작페이지",
  description: "검색, 날씨, 캘린더, 포트폴리오, 루틴, 가계부까지 한 곳에서 — 나만의 시작페이지",
  openGraph: {
    title: "시작페이지",
    description: "검색, 날씨, 캘린더, 포트폴리오, 루틴, 가계부까지 한 곳에서 — 나만의 시작페이지",
    locale: "ko_KR",
    type: "website",
  },
  other: {
    "theme-color": "#6D5EF0",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
