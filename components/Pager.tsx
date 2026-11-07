"use client";

import { useEffect, useState } from "react";

/** Splits `items` into pages of `size` and renders page buttons. Returns the items for the current page. */
export function usePages<T>(items: T[], size: number, anchor?: string) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const [page, setPage] = useState(1);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const go = (n: number) => {
    setPage(Math.min(pages, Math.max(1, n)));
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: "start" });
  };
  const at = Math.min(page, pages);
  return { slice: items.slice((at - 1) * size, at * size), page: at, pages, go, total: items.length, size };
}

export default function Pager({ page, pages, go, total, size, noun }: ReturnType<typeof usePages> & { noun: string }) {
  if (pages <= 1) return null;
  // 1 … 4 5 6 … 12
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
  const first = (page - 1) * size + 1, last = Math.min(total, page * size);
  return (
    <nav aria-label={`More ${noun}`}>
      <div className="pager">
        <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page">←</button>
        {nums.map((n, i) => (
          <span key={n} style={{ display: "contents" }}>
            {i > 0 && n - nums[i - 1] > 1 && <span className="gap" aria-hidden="true">…</span>}
            <button type="button" className="num" onClick={() => go(n)} aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`}>{n}</button>
          </span>
        ))}
        <button type="button" onClick={() => go(page + 1)} disabled={page === pages} aria-label="Next page">→</button>
      </div>
      <p className="pager-note" aria-live="polite">Showing {first}–{last} of {total} {noun}</p>
    </nav>
  );
}
