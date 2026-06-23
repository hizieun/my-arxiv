import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// proxy(Next 16의 미들웨어)에서 매 요청마다 세션 토큰을 갱신한다.
// @supabase/ssr 공식 패턴: 요청/응답 쿠키를 동기화하고 getUser()로 세션을 새로고침.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser()를 호출해야 만료 임박 토큰이 갱신된다. 호출 결과 자체는 쓰지 않음.
  await supabase.auth.getUser();

  return supabaseResponse;
}
