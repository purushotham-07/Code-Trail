import { motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';
import { buildSideBySideDiff, calculateDiffStats, diffLines } from '../utils/diff.js';

const DiffViewer = memo(function DiffViewer({
  oldCode = '',
  newCode = '',
  oldTitle = 'Original',
  newTitle = 'Modified',
  maxHeight = '500px',
}) {
  const [mode, setMode] = useState('split'); // Default to split view like VS Code
  const [wrapLines, setWrapLines] = useState(false);
  const [copied, setCopied] = useState(false);

  const { lines, sideBySideRows, stats } = useMemo(() => {
    const oldLines = oldCode ? oldCode.split('\n') : [];
    const newLines = newCode ? newCode.split('\n') : [];
    const ops = diffLines(oldLines, newLines);
    const rows = buildSideBySideDiff(ops);
    const diffStats = calculateDiffStats(ops);

    return {
      lines: ops,
      sideBySideRows: rows,
      stats: diffStats,
    };
  }, [oldCode, newCode]);

  const handleCopyUnifiedDiff = () => {
    const diffText = lines
      .map((line) => {
        const sign = line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' ';
        return `${sign} ${line.value}`;
      })
      .join('\n');
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (oldCode === newCode) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0d1117] p-8 text-center shadow-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 text-emerald-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-200">Identical Content</p>
        <p className="mt-1 text-xs text-slate-500">No differences detected between these two versions.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] shadow-2xl"
    >
      {/* VS Code Tab Bar & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs">
        {/* Left: Tab Indicator & Diff Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-md bg-[#21262d] px-2.5 py-1 font-code text-[11.5px] text-slate-200 border border-[#30363d]">
            <span className="text-slate-400">{oldTitle}</span>
            <span className="text-slate-500">↔</span>
            <span className="text-blue-400 font-medium">{newTitle}</span>
          </div>

          <div className="flex items-center gap-1.5 font-code text-[11px]">
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/25">
              +{stats.additions}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 px-2 py-0.5 font-bold text-rose-400 border border-rose-500/25">
              -{stats.deletions}
            </span>
            <span className="text-slate-400 text-[11px]">
              ({stats.totalChanges} {stats.totalChanges === 1 ? 'change' : 'changes'})
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyUnifiedDiff}
            className="rounded px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-[#21262d] hover:text-slate-200 transition-colors"
          >
            {copied ? '✓ Copied Diff' : 'Copy Diff'}
          </button>

          <button
            type="button"
            onClick={() => setWrapLines((prev) => !prev)}
            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              wrapLines
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-[#21262d] hover:text-slate-200'
            }`}
          >
            {wrapLines ? 'Wrap: On' : 'Wrap: Off'}
          </button>

          {/* Mode Switcher */}
          <div className="flex overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117] p-0.5">
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === 'split'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
              Split
            </button>
            <button
              type="button"
              onClick={() => setMode('unified')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === 'unified'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Unified
            </button>
          </div>
        </div>
      </div>

      {/* BODY VIEW */}
      {mode === 'split' ? (
        /* Split (Side-by-Side) Mode */
        <div className="flex flex-col">
          {/* Subheaders for Left & Right Panes */}
          <div className="grid grid-cols-2 border-b border-[#30363d] bg-[#161b22] text-[11px] font-medium text-slate-400">
            <div className="flex items-center justify-between border-r border-[#30363d] px-4 py-1.5">
              <span className="font-code text-slate-300">{oldTitle} (Base)</span>
            </div>
            <div className="flex items-center justify-between px-4 py-1.5">
              <span className="font-code text-blue-400">{newTitle} (Compare)</span>
            </div>
          </div>

          <div
            style={{ maxHeight }}
            className="overflow-auto font-code text-[12.5px] leading-[22px] select-text"
          >
            <div className="min-w-full inline-block">
              {sideBySideRows.map((row, idx) => {
                const leftDel = row.left.type === 'deleted';
                const leftEmpty = row.left.type === 'empty';
                const rightAdd = row.right.type === 'added';
                const rightEmpty = row.right.type === 'empty';

                return (
                  <div
                    key={`split-${idx}`}
                    className="grid grid-cols-2 border-b border-[#21262d]/50 h-[22px] min-h-[22px]"
                  >
                    {/* Left Pane (Base) */}
                    <div
                      className={`flex items-center border-r border-[#30363d] transition-colors h-full ${
                        leftDel
                          ? 'diff-deleted-bg diff-deleted-border'
                          : leftEmpty
                          ? 'diff-hatch-pattern'
                          : 'bg-[#0d1117] hover:bg-[#161b22]'
                      }`}
                    >
                      <span className="w-11 shrink-0 select-none bg-[#161b22]/90 pr-2 text-right font-code text-[11px] text-slate-500 border-r border-[#30363d] leading-[22px] h-full flex items-center justify-end">
                        {row.left.lineNumber || ''}
                      </span>
                      <span
                        className={`w-5 shrink-0 select-none text-center font-code font-bold text-xs ${
                          leftDel ? 'text-rose-400' : 'text-transparent'
                        }`}
                      >
                        {leftDel ? '-' : ' '}
                      </span>
                      <span
                        className={`flex-1 px-2 font-code text-[12.5px] leading-[22px] overflow-hidden ${
                          wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                        } ${
                          leftDel ? 'text-rose-200' : leftEmpty ? 'text-transparent' : 'text-slate-200'
                        }`}
                      >
                        {row.left.value || ' '}
                      </span>
                    </div>

                    {/* Right Pane (Modified) */}
                    <div
                      className={`flex items-center transition-colors h-full ${
                        rightAdd
                          ? 'diff-added-bg diff-added-border'
                          : rightEmpty
                          ? 'diff-hatch-pattern'
                          : 'bg-[#0d1117] hover:bg-[#161b22]'
                      }`}
                    >
                      <span className="w-11 shrink-0 select-none bg-[#161b22]/90 pr-2 text-right font-code text-[11px] text-slate-500 border-r border-[#30363d] leading-[22px] h-full flex items-center justify-end">
                        {row.right.lineNumber || ''}
                      </span>
                      <span
                        className={`w-5 shrink-0 select-none text-center font-code font-bold text-xs ${
                          rightAdd ? 'text-emerald-400' : 'text-transparent'
                        }`}
                      >
                        {rightAdd ? '+' : ' '}
                      </span>
                      <span
                        className={`flex-1 px-2 font-code text-[12.5px] leading-[22px] overflow-hidden ${
                          wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                        } ${
                          rightAdd ? 'text-emerald-200' : rightEmpty ? 'text-transparent' : 'text-slate-200'
                        }`}
                      >
                        {row.right.value || ' '}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Unified Mode */
        <div
          style={{ maxHeight }}
          className="overflow-auto font-code text-[12.5px] leading-[22px] select-text"
        >
          <div className="min-w-full inline-block">
            {lines.map((line, idx) => {
              const isAdded = line.type === 'added';
              const isDeleted = line.type === 'deleted';

              return (
                <div
                  key={`u-${idx}`}
                  className={`flex items-center border-b border-[#21262d]/50 h-[22px] min-h-[22px] transition-colors ${
                    isAdded
                      ? 'diff-added-bg diff-added-border'
                      : isDeleted
                      ? 'diff-deleted-bg diff-deleted-border'
                      : 'bg-[#0d1117] hover:bg-[#161b22]'
                  }`}
                >
                  {/* Old line number */}
                  <span className="w-11 shrink-0 select-none bg-[#161b22]/90 pr-2 text-right font-code text-[11px] text-slate-500 border-r border-[#30363d] leading-[22px] h-full flex items-center justify-end">
                    {line.oldLineNumber || ''}
                  </span>
                  {/* New line number */}
                  <span className="w-11 shrink-0 select-none bg-[#161b22]/90 pr-2 text-right font-code text-[11px] text-slate-500 border-r border-[#30363d] leading-[22px] h-full flex items-center justify-end">
                    {line.newLineNumber || ''}
                  </span>
                  {/* Sign indicator */}
                  <span
                    className={`w-6 shrink-0 select-none text-center font-code font-bold text-xs ${
                      isAdded
                        ? 'text-emerald-400'
                        : isDeleted
                        ? 'text-rose-400'
                        : 'text-transparent'
                    }`}
                  >
                    {isAdded ? '+' : isDeleted ? '-' : ' '}
                  </span>
                  {/* Code text */}
                  <span
                    className={`flex-1 px-2 font-code text-[12.5px] leading-[22px] ${
                      wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                    } ${
                      isAdded
                        ? 'text-emerald-200'
                        : isDeleted
                        ? 'text-rose-200'
                        : 'text-slate-200'
                    }`}
                  >
                    {line.value || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default DiffViewer;