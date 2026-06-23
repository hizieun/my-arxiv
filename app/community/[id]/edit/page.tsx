import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/PostForm";
import { updatePost } from "../../actions";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/${id}/edit`);

  const { data } = await supabase.from("posts").select("*").eq("id", id).single();
  if (!data) notFound();
  const post = data as Post;

  // 본인 글이 아니면 상세로 돌려보냄 (RLS도 update를 막지만 UI에서도 차단)
  if (post.author_id !== user.id) redirect(`/community/${id}`);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/community/${id}`}
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← 글로 돌아가기
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold tracking-tight">글 수정</h1>
      <PostForm
        action={updatePost}
        initial={{ id: post.id, title: post.title, body: post.body, tags: post.tags }}
        submitLabel="수정 저장"
      />
    </div>
  );
}
