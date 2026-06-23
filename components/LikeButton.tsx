import { toggleLike } from "@/app/community/actions";

interface Props {
  postId: string;
  count: number;
  liked: boolean;
}

// 서버액션 폼으로 동작 (클라이언트 JS 없이도 토글). 카드/상세 공용.
export function LikeButton({ postId, count, liked }: Props) {
  return (
    <form action={toggleLike} className="inline-flex">
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="submit"
        aria-label={liked ? "좋아요 취소" : "좋아요"}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm transition-colors",
          liked
            ? "bg-rose-50 text-rose-600"
            : "text-[var(--muted)] hover:text-rose-600",
        ].join(" ")}
      >
        <span>{liked ? "♥" : "♡"}</span>
        <span>{count}</span>
      </button>
    </form>
  );
}
