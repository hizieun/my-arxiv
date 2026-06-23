import { toggleLike } from "@/app/community/actions";

interface Props {
  postId: string;
  count: number;
  liked: boolean;
  /** 토글 후 추가로 갱신할 현재 페이지 경로 (예: /u/이름). 생략 시 커뮤니티 경로만 갱신 */
  from?: string;
}

// 서버액션 폼으로 동작 (클라이언트 JS 없이도 토글). 카드/상세/프로필 공용.
export function LikeButton({ postId, count, liked, from }: Props) {
  return (
    <form action={toggleLike} className="inline-flex">
      <input type="hidden" name="post_id" value={postId} />
      {from && <input type="hidden" name="from" value={from} />}
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
