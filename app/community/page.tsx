import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function excerpt(markdown: string, len = 140): string {
  const plain = markdown
    .replace(/`{1,3}[^`]*`{1,3}/g, " ") // 코드
    .replace(/[#>*_\-!\[\]()]/g, " ") // 마크다운 기호
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > len ? plain.slice(0, len) + "…" : plain;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, author:profiles(username, avatar_url)")
    .order("created_at", { ascending: false });
  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query;
  const posts = (data ?? []) as PostWithAuthor[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📓 Community</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            각자 공부한 내용을 마크다운으로 공유하는 공간
          </p>
        </div>
        <Link
          href="/community/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          ✏️ 글쓰기
        </Link>
      </div>

      {tag && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-[var(--muted)]">태그 필터:</span>
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 font-medium text-[var(--accent)]">
            #{tag}
          </span>
          <Link href="/community" className="text-[var(--muted)] hover:text-[var(--foreground)]">
            ✕ 해제
          </Link>
        </div>
      )}

      {error ? (
        <p className="rounded-lg border border-[var(--border)] p-6 text-sm text-rose-600">
          글을 불러오지 못했어요. Supabase 설정(환경변수·스키마)을 확인하세요.
        </p>
      ) : posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          아직 글이 없어요. 첫 글을 작성해 보세요!
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--accent)]"
            >
              <Link href={`/community/${post.id}`} className="block">
                <h2 className="text-lg font-semibold tracking-tight">{post.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                  {excerpt(post.body)}
                </p>
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span className="font-medium text-[var(--foreground)]">
                  @{post.author?.username ?? "알 수 없음"}
                </span>
                <span>·</span>
                <span>{formatDate(post.created_at)}</span>
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/community?tag=${encodeURIComponent(t)}`}
                    className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[var(--accent)]"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
