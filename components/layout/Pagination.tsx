import React, { useMemo } from "react";

type Props = {
  totalItems: number;
  page: number;                 // 1-based
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextSize: number) => void;
  pageSizeOptions?: number[];   // default: [3, 10, 25, 50]
  className?: string;
};

function buildPageRange(current: number, totalPages: number, delta = 1) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const left = Math.max(2, current - delta);
  const right = Math.min(totalPages - 1, current + delta);
  const range: (number | "...")[] = [1];

  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < totalPages - 1) range.push("...");
  range.push(totalPages);

  return range;
}

export const Pagination: React.FC<Props> = ({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [3, 10, 25, 50],
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = useMemo(
    () => (totalItems === 0 ? 0 : (page - 1) * pageSize + 1),
    [page, pageSize, totalItems]
  );
  const to = useMemo(
    () => Math.min(page * pageSize, totalItems),
    [page, pageSize, totalItems]
  );
  const pages = useMemo(() => buildPageRange(page, totalPages, 1), [page, totalPages]);

  const goPrev = () => page > 1 && onPageChange(page - 1);
  const goNext = () => page < totalPages && onPageChange(page + 1);

  return (
    <div
      className={[
        // keep this row minimal; the card above can own the background
        "w-full px-2 py-2",
        "grid grid-cols-3 items-center",
        className,
      ].join(" ")}
    >
      {/* Left: showing text */}
      <div className="justify-self-start text-sm text-gray-600">
        {`Showing ${from} to ${to} of ${totalItems} results`}
      </div>

      {/* Middle: per page — compact rounded chip with border */}
      <div className="justify-self-center">
        <div className="relative inline-flex items-center rounded-full border border-gray-200 bg-white shadow-sm">
          <span className="px-3 py-1.5 text-sm text-gray-600">Per page</span>
          <select
            className="appearance-none bg-transparent px-3 py-1.5 pr-8 text-sm text-gray-800 outline-none"
            value={pageSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              onPageSizeChange?.(next);
              onPageChange(1);
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {/* caret */}
          <svg
            className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Right: pager — segmented group with separators */}
      <nav aria-label="Pagination" className="justify-self-end">
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            type="button"
            onClick={goPrev}
            disabled={page <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Previous"
            aria-label="Previous"
          >
            ‹
          </button>

          {/* Numbers group */}
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex divide-x divide-gray-200">
              {pages.map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="select-none px-3 py-1.5 text-sm text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    aria-current={p === page ? "page" : undefined}
                    onClick={() => onPageChange(p as number)}
                    className={[
                      "min-w-8 px-3 py-1.5 text-sm transition",
                      p === page
                        ? "bg-amber-50 text-amber-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={goNext}
            disabled={page >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Next"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </nav>
    </div>
  );
};