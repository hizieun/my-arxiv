"use client";

import { useMemo } from "react";
import { AI_CATEGORIES, DEFAULT_SELECTED_CATEGORIES } from "@/lib/categories";
import { setCategories, useCategories, useHydrated } from "@/lib/storage";

export default function CategoriesPage() {
  const selected = useCategories(DEFAULT_SELECTED_CATEGORIES);
  const hydrated = useHydrated();

  function toggle(code: string) {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    setCategories(next); // dispatches STORAGE_EVENT → useCategories re-reads
  }

  const grouped = useMemo(() => {
    const map = new Map<string, typeof AI_CATEGORIES>();
    for (const cat of AI_CATEGORIES) {
      const arr = map.get(cat.group) ?? [];
      arr.push(cat);
      map.set(cat.group, arr);
    }
    return [...map.entries()];
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">관심 카테고리</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          선택한 arXiv 카테고리의 신규 논문이 피드에 노출됩니다.
          {hydrated && (
            <span className="ml-2 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
              {selected.length}개 선택됨
            </span>
          )}
        </p>
      </header>

      <div className="space-y-8">
        {grouped.map(([group, cats]) => (
          <section key={group}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              {group}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {cats.map((cat) => {
                const on = selected.includes(cat.code);
                return (
                  <li key={cat.code}>
                    <button
                      type="button"
                      onClick={() => toggle(cat.code)}
                      className={[
                        "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                        on
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]",
                      ].join(" ")}
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold">{cat.code}</div>
                        <div className="text-xs text-[var(--muted)]">{cat.name}</div>
                      </div>
                      <Toggle on={on} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={[
        "relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors",
        on ? "bg-[var(--accent)]" : "bg-[var(--border)]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </span>
  );
}
