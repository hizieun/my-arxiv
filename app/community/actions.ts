"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 쉼표/공백/# 으로 구분된 태그 입력을 정규화 (소문자, 중복 제거, # 제거)
function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const t of raw.split(/[,\s]+/)) {
    const tag = t.replace(/^#/, "").trim();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community/new");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  if (!title || !body) throw new Error("제목과 본문을 입력하세요.");

  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, title, body, tags })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/community");
  redirect(`/community/${data.id}`);
}

export async function updatePost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  if (!id || !title || !body) throw new Error("제목과 본문을 입력하세요.");

  // RLS가 본인 글만 허용하지만, 서버에서도 author_id로 한 번 더 제한.
  const { error } = await supabase
    .from("posts")
    .update({ title, body, tags })
    .eq("id", id)
    .eq("author_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/community");
  revalidatePath(`/community/${id}`);
  redirect(`/community/${id}`);
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("잘못된 요청입니다.");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/community");
  redirect("/community");
}

export async function addComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const postId = String(formData.get("post_id") ?? "");
  if (!user) redirect(`/login?next=/community/${postId}`);

  const body = String(formData.get("body") ?? "").trim();
  if (!postId || !body) return; // 빈 댓글 무시

  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body });
  if (error) throw new Error(error.message);

  revalidatePath(`/community/${postId}`);
}

export async function toggleLike(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const postId = String(formData.get("post_id") ?? "");
  if (!user) redirect(`/login?next=/community/${postId}`);
  if (!postId) return;

  // 이미 눌렀으면 취소, 아니면 추가 (토글)
  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
  const from = String(formData.get("from") ?? "");
  if (from) revalidatePath(from);
}

export async function deleteComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  if (!id) throw new Error("잘못된 요청입니다.");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/community/${postId}`);
}
