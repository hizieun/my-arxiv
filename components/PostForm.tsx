"use client";

import { useState } from "react";
import { Markdown } from "@/components/Markdown";

interface PostFormProps {
  action: (formData: FormData) => void | Promise<void>;
  initial?: { id?: string; title: string; body: string; tags: string[] };
  submitLabel: string;
}

export function PostForm({ action, initial, submitLabel }: PostFormProps) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [preview, setPreview] = useState(false);

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
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-sm text-[var(--accent)]"
          >
            {preview ? "✏️ 편집" : "👁 미리보기"}
          </button>
        </div>
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
            id="body"
            name="body"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            placeholder={"# 제목\n\n오늘 배운 내용을 마크다운으로 자유롭게 작성하세요.\n\n- 핵심 1\n- 핵심 2\n\n```js\nconsole.log('code blocks도 지원')\n```"}
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
