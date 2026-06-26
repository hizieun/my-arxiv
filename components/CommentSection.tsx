import Link from "next/link";
import { addComment, deleteComment } from "@/app/community/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { timeAgo, absoluteTime } from "@/lib/time";
import type { CommentWithAuthor } from "@/lib/types";

interface Props {
  postId: string;
  comments: CommentWithAuthor[];
  currentUserId: string | null;
}

export function CommentSection({ postId, comments, currentUserId }: Props) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold">
        댓글 <span className="text-[var(--muted)]">{comments.length}</span>
      </h2>

      {currentUserId ? (
        <form action={addComment} className="mb-6">
          <input type="hidden" name="post_id" value={postId} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="댓글을 남겨보세요"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="mt-2 flex justify-end">
            <SubmitButton
              pendingLabel="작성 중…"
              className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              댓글 작성
            </SubmitButton>
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-lg border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
          <Link href={`/login?next=/community/${postId}`} className="text-[var(--accent)] underline">
            로그인
          </Link>
          하고 댓글을 남겨보세요.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">아직 댓글이 없어요.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span>
                  <Link
                    href={`/u/${c.author?.username ?? ""}`}
                    className="font-medium text-[var(--foreground)] hover:underline"
                  >
                    @{c.author?.username ?? "알 수 없음"}
                  </Link>
                  <span className="ml-2" title={absoluteTime(c.created_at)}>{timeAgo(c.created_at)}</span>
                </span>
                {currentUserId === c.author_id && (
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="post_id" value={postId} />
                    <ConfirmButton
                      message="이 댓글을 삭제할까요?"
                      pendingChildren="삭제 중…"
                      className="text-rose-600 hover:underline disabled:opacity-50"
                    >
                      삭제
                    </ConfirmButton>
                  </form>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
