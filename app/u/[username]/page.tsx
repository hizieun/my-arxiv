import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LikeButton } from "@/components/LikeButton";
import type { Post, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function excerpt(markdown: string, len = 120): string {
  const plain = markdown
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/[#>*_\-!\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > len ? plain.slice(0, len) + "…" : plain;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (!profileData) notFound();
  const profile = profileData as Profile;

  const { data: postData } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });
  const posts = (postData ?? []) as Post[];

  // 좋아요 집계 (이 사람 글에 한정)
  const postIds = posts.map((p) => p.id);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: likeRows } = postIds.length
    ? await supabase.from("likes").select("post_id, user_id").in("post_id", postIds)
    : { data: [] };
  const likeCount = new Map<string, number>();
  const myLikes = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCount.set(row.post_id, (likeCount.get(row.post_id) ?? 0) + 1);
    if (user && row.user_id === user.id) myLikes.add(row.post_id);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="h-16 w-16 rounded-full border border-[var(--border)]"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-2xl text-[var(--accent)]">
            {profile.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">@{profile.username}</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            글 {posts.length}개 · 가입 {formatDate(profile.created_at)}
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          아직 작성한 글이 없어요.
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
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{excerpt(post.body)}</p>
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
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
                <span className="ml-auto">
                  <LikeButton
                    postId={post.id}
                    count={likeCount.get(post.id) ?? 0}
                    liked={myLikes.has(post.id)}
                    from={`/u/${profile.username}`}
                  />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
