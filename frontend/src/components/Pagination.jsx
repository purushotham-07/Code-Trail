import { motion } from 'framer-motion';
import { memo } from 'react';

const Pagination = memo(function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Prev
      </motion.button>
      {start > 1 && <span className="px-1 text-slate-400 dark:text-slate-600">…</span>}
      {pages.map((p) => (
        <motion.button
          key={p}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => onPageChange(p)}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            p === page
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {p}
        </motion.button>
      ))}
      {end < totalPages && <span className="px-1 text-slate-400 dark:text-slate-600">…</span>}
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </motion.button>
    </nav>
  );
});

export default Pagination;