import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/Markdown";
import { deletePost } from "../actions";
import type { PostWithAuthor } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select("*, author:profiles(username, avatar_url)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const post = data as PostWithAuthor;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === post.author_id;

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/community" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Community
      </Link>

      <h1 className="mb-2 mt-2 text-3xl font-bold tracking-tight">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <span className="font-medium text-[var(--foreground)]">
          @{post.author?.username ?? "알 수 없음"}
        </span>
        <span>·</span>
        <span>{formatDate(post.created_at)}</span>
        {post.updated_at !== post.created_at && <span>(수정됨)</span>}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/community?tag=${encodeURIComponent(t)}`}
              className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs text-[var(--accent)]"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Link
            href={`/community/${post.id}/edit`}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]"
          >
            ✏️ 수정
          </Link>
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-rose-600 hover:border-rose-400"
            >
              🗑 삭제
            </button>
          </form>
        </div>
      )}

      <hr className="my-6 border-[var(--border)]" />

      <Markdown>{post.body}</Markdown>
    </article>
  );
}
