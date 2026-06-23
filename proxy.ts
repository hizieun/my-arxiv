import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: Middleware → Proxy 로 이름 변경 (파일명 proxy.ts, export proxy).
// Supabase 세션 토큰을 매 요청 갱신한다.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 정적 자산·이미지·아이콘은 제외하고 페이지 요청에만 적용.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
