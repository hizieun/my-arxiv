import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "my-arxiv — AI 논문 디스커버리",
    short_name: "my-arxiv",
    description: "관심있는 AI 분야의 신규 논문을 한 곳에서 탐색하고 관리한다",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#2563eb",
    lang: "ko",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
