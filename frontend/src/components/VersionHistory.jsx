import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';

// Displays the list of versions for a snippet.
// Each item shows version number, commit message, author avatar, and date.
const VersionHistory = memo(function VersionHistory({ versions = [], selectedVersion, onSelect }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
        Version History
      </div>
      <AnimatePresence initial={false}>
        <div className="max-h-[480px] overflow-auto">
          {versions.map((version, index) => {
            const isSelected = selectedVersion === version.versionNumber;
            return (
              <motion.button
                key={version.versionNumber}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                type="button"
                onClick={() => onSelect?.(version.versionNumber)}
                className={`flex w-full items-start gap-3 border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-600/10 border-l-2 border-l-blue-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ${
                    version.snapshot
                      ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  v{version.versionNumber}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">{version.commitMessage}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {version.author?.avatar && (
                      <img src={version.author.avatar} alt={version.author.name} className="h-4 w-4 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                    )}
                    <span className="truncate">{version.author?.name || 'Unknown'}</span>
                    <span>·</span>
                    <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
});

export default VersionHistory;