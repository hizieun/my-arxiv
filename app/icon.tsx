import { ImageResponse } from "next/og";

// 파비콘·탭·일반 앱 아이콘 (코드 생성 — 외부 PNG 자산 불필요)
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          fontSize: 340,
        }}
      >
        📚
      </div>
    ),
    { ...size },
  );
}
