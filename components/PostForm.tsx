"use client";

import { useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { createClient } from "@/lib/supabase/client";

interface PostFormProps {
  action: (formData: FormData) => void | Promise<void>;
  initial?: { id?: string; title: string; body: string; tags: string[] };
  submitLabel: string;
}

const MAX_MB = 5;

export function PostForm({ action, initial, submitLabel }: PostFormProps) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setBody((b) => b + text);
      return;
    }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + text + body.slice(end));
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadErr(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadErr("로그인이 필요합니다.");
        return;
      }
      const inserts: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setUploadErr("이미지 파일만 업로드할 수 있어요.");
          continue;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
          setUploadErr(`이미지는 ${MAX_MB}MB 이하만 가능해요.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("post-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          setUploadErr(error.message);
          continue;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(path);
        inserts.push(`![${file.name}](${publicUrl})`);
      }
      if (inserts.length) insertAtCursor(`\n${inserts.join("\n")}\n`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={action} className="space-y-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="title">
          제목
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title}
          placeholder="오늘 배운 것의 제목"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="body">
            본문 <span className="text-[var(--muted)]">(마크다운)</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm text-[var(--accent)] disabled:opacity-50"
            >
              {uploading ? "업로드 중…" : "🖼 이미지"}
            </button>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="text-sm text-[var(--accent)]"
            >
              {preview ? "✏️ 편집" : "👁 미리보기"}
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadErr && <p className="mb-1 text-sm text-rose-600">{uploadErr}</p>}
        {preview ? (
          <div className="min-h-[16rem] rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            {body.trim() ? (
              <Markdown>{body}</Markdown>
            ) : (
              <p className="text-sm text-[var(--muted)]">미리볼 내용이 없습니다.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            id="body"
            name="body"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            placeholder={"# 제목\n\n오늘 배운 내용을 마크다운으로 자유롭게 작성하세요.\n\n- 핵심 1\n- 핵심 2\n\n🖼 이미지 버튼으로 스크린샷·다이어그램을 바로 올릴 수 있어요."}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--accent)]"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="tags">
          태그 <span className="text-[var(--muted)]">(쉼표로 구분)</span>
        </label>
        <input
          id="tags"
          name="tags"
          defaultValue={initial?.tags.join(", ")}
          placeholder="RAG, LLM, TIL"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
      >
        {submitLabel}
      </button>
    </form>
  );
}
