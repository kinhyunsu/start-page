import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#FAFAFC",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#6D5EF0",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            시
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#17151F" }}>
            시작페이지
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 56,
            fontWeight: 700,
            color: "#17151F",
            lineHeight: 1.25,
          }}
        >
          <span>검색·날씨·캘린더부터</span>
          <span>포트폴리오·구독·가계부·루틴까지</span>
        </div>
        <div style={{ fontSize: 28, color: "#635F72", marginTop: 28 }}>
          한 페이지에서 관리하는 개인 대시보드
        </div>
      </div>
    ),
    { ...size }
  );
}
