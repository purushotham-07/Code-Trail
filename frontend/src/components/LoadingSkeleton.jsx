import { motion } from 'framer-motion';

const pulse = {
  initial: { opacity: 0.4 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
};

export function SnippetCardSkeleton() {
  return (
    <motion.div {...pulse} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-2 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </motion.div>
  );
}

export function SnippetGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <SnippetCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CodeEditorSkeleton() {
  return (
    <motion.div {...pulse} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="mb-4 flex gap-2">
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="mb-2 h-3 rounded bg-slate-200 dark:bg-slate-800" style={{ width: `${90 - (index % 4) * 12}%` }} />
      ))}
    </motion.div>
  );
}