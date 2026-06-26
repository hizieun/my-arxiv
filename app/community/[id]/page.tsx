import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/Markdown";
import { CommentSection } from "@/components/CommentSection";
import { LikeButton } from "@/components/LikeButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { timeAgo, absoluteTime } from "@/lib/time";
import { deletePost } from "../actions";
import type { PostWithAuthor, CommentWithAuthor } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    // likes 추가로 posts→profiles 경로가 둘이 되어 FK 이름 명시 (PGRST201 해소)
    .select("*, author:profiles!posts_author_id_fkey(username, avatar_url)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const post = data as PostWithAuthor;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === post.author_id;

  // 댓글 (테이블 미생성/오류 시에도 페이지는 깨지지 않도록 [] 폴백)
  const { data: commentData } = await supabase
    .from("comments")
    .select("*, author:profiles(username, avatar_url)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });
  const comments = (commentData ?? []) as CommentWithAuthor[];

  // 좋아요 수 + 내가 눌렀는지
  const { data: likeRows } = await supabase
    .from("likes")
    .select("user_id")
    .eq("post_id", id);
  const likeCount = likeRows?.length ?? 0;
  const liked = !!(user && likeRows?.some((r) => r.user_id === user.id));

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/community" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Community
      </Link>

      <h1 className="mb-2 mt-2 text-3xl font-bold tracking-tight">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <Link
          href={`/u/${post.author?.username ?? ""}`}
          className="font-medium text-[var(--foreground)] hover:underline"
        >
          @{post.author?.username ?? "알 수 없음"}
        </Link>
        <span>·</span>
        <span title={absoluteTime(post.created_at)}>{timeAgo(post.created_at)}</span>
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
            <ConfirmButton
              message="이 글을 삭제할까요? 되돌릴 수 없습니다."
              pendingChildren="삭제 중…"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-rose-600 transition-colors hover:border-rose-400 disabled:opacity-50"
            >
              🗑 삭제
            </ConfirmButton>
          </form>
        </div>
      )}

      <div className="mt-4">
        <LikeButton postId={post.id} count={likeCount} liked={liked} />
      </div>

      <hr className="my-6 border-[var(--border)]" />

      <Markdown>{post.body}</Markdown>

      <CommentSection postId={post.id} comments={comments} currentUserId={user?.id ?? null} />
    </article>
  );
}
