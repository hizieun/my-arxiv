"use client";

import { useEffect, useRef, useState } from "react";

// 피드 키보드 내비게이션: j/k로 카드 이동, Enter/o로 상세 열기.
// 입력 요소(input/textarea/contenteditable)에 포커스된 동안은 무시.
// 선택 인덱스는 [data-feed-item="i"] 래퍼로 스크롤·열기와 연결한다.
export function useFeedKeyboard(count: number): number {
  const [selected, setSelected] = useState(-1);
  const selectedRef = useRef(-1); // 핸들러에서만 읽고 씀 (렌더 중 접근 X)

  useEffect(() => {
    function setSel(n: number) {
      selectedRef.current = n;
      setSelected(n);
      document
        .querySelector(`[data-feed-item="${n}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (count === 0) return;

      if (e.key === "j") {
        e.preventDefault();
        setSel(Math.min(selectedRef.current + 1, count - 1));
      } else if (e.key === "k") {
        e.preventDefault();
        setSel(Math.max(selectedRef.current - 1, 0));
      } else if (e.key === "Enter" || e.key === "o") {
        const i = selectedRef.current;
        if (i < 0) return;
        const link = document.querySelector<HTMLAnchorElement>(
          `[data-feed-item="${i}"] a[href^="/paper/"]`,
        );
        if (link) {
          e.preventDefault();
          link.click();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  return selected;
}
