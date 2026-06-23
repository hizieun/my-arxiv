import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/PostForm";
import { createPost } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community/new");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/community" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Community
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold tracking-tight">새 글 쓰기</h1>
      <PostForm action={createPost} submitLabel="발행하기" />
    </div>
  );
}
