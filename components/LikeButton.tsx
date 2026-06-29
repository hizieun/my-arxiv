"use client";

import { useOptimistic } from "react";
import { toggleLike } from "@/app/community/actions";

interface Props {
  postId: string;
  count: number;
  liked: boolean;
  /** 토글 후 추가로 갱신할 현재 페이지 경로 (예: /u/이름). 생략 시 커뮤니티 경로만 갱신 */
  from?: string;
}

// 서버액션 폼 + useOptimistic: 클릭 즉시 ♥/카운트가 반영되고(낙관적),
// 서버 처리·revalidate 후 실제 값으로 수렴. 목록/상세/프로필 공용.
export function LikeButton({ postId, count, liked, from }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(
    { count, liked },
    (_state, next: { count: number; liked: boolean }) => next,
  );

  return (
    <form
      action={(fd) => {
        setOptimistic({
          liked: !optimistic.liked,
          count: optimistic.liked ? optimistic.count - 1 : optimistic.count + 1,
        });
        return toggleLike(fd);
      }}
      className="inline-flex"
    >
      <input type="hidden" name="post_id" value={postId} />
      {from && <input type="hidden" name="from" value={from} />}
      <button
        type="submit"
        aria-pressed={optimistic.liked}
        aria-label={optimistic.liked ? "좋아요 취소" : "좋아요"}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm transition-colors",
          optimistic.liked
            ? "bg-rose-50 text-rose-600"
            : "text-[var(--muted)] hover:text-rose-600",
        ].join(" ")}
      >
        <span>{optimistic.liked ? "♥" : "♡"}</span>
        <span>{optimistic.count}</span>
      </button>
    </form>
  );
}
