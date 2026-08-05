import { motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';
import { diffLines } from '../utils/diff.js';

const typeStyles = {
  added: {
    bg: 'bg-emerald-950/50',
    badge: 'bg-emerald-500 text-emerald-950',
    label: 'Added',
  },
  deleted: {
    bg: 'bg-red-950/50',
    badge: 'bg-red-500 text-red-950',
    label: 'Deleted',
  },
  unchanged: {
    bg: 'bg-transparent',
    badge: 'bg-slate-700 text-slate-200',
    label: 'Unchanged',
  },
};

// Separates a flat diff sequence into the "old side" and "new side" line
// arrays used by the side-by-side view. Added lines appear only on the right,
// deleted lines only on the left, unchanged lines on both sides.
function buildSideBySide(ops) {
  const left = [];
  const right = [];

  for (const op of ops) {
    if (op.type === 'unchanged') {
      left.push({ type: 'unchanged', value: op.value });
      right.push({ type: 'unchanged', value: op.value });
    } else if (op.type === 'deleted') {
      left.push({ type: 'deleted', value: op.value });
      right.push({ type: 'added', value: '' }); // blank placeholder
    } else {
      left.push({ type: 'deleted', value: '' });
      right.push({ type: 'added', value: op.value });
    }
  }

  return { left, right };
}

// Renders a line-by-line diff between two code strings using the LCS algorithm.
// Supports both unified view and side-by-side view. Added lines are green,
// deleted lines red, and unchanged lines gray.
const DiffViewer = memo(function DiffViewer({ oldCode = '', newCode = '' }) {
  const [mode, setMode] = useState('unified');

  const { lines, sides } = useMemo(() => {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const ops = diffLines(oldLines, newLines);
    return {
      lines: ops,
      sides: buildSideBySide(ops),
    };
  }, [oldCode, newCode]);

  if (oldCode === newCode) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
        No changes between these versions.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
    >
      {/* Header with mode toggle */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Added
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Deleted
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-700/30 px-2.5 py-1 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-slate-500" /> Unchanged
        </span>
        <span className="ml-2 hidden text-[10px] text-slate-500 lg:inline">Scroll inside to see the full diff</span>
        <div className="ml-auto flex overflow-hidden rounded-md border border-slate-700">
          <button
            type="button"
            onClick={() => setMode('unified')}
            className={`px-3 py-1 transition-colors ${
              mode === 'unified' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Unified
          </button>
          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={`px-3 py-1 transition-colors ${
              mode === 'side-by-side' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Side-by-side
          </button>
        </div>
      </div>

      {mode === 'unified' ? (
        <div className="max-h-[240px] overflow-auto font-mono text-sm">
          {lines.map((line, index) => {
            const style = typeStyles[line.type];
            return (
              <div key={index} className={`flex items-stretch border-b border-slate-800/50 ${style.bg}`}>
                <span className="w-10 shrink-0 select-none border-r border-slate-800/60 px-2 py-1 text-right text-xs text-slate-600">
                  {style.label === 'Added' ? '+' : style.label === 'Deleted' ? '-' : ' '}
                </span>
                <span
                  className={`flex-1 whitespace-pre-wrap break-all px-3 py-1 ${
                    line.type === 'unchanged'
                      ? 'text-slate-400'
                      : line.type === 'added'
                        ? 'text-emerald-200'
                        : 'text-red-300'
                  }`}
                >
                  {line.value || ' '}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid max-h-[240px] grid-cols-2 overflow-auto font-mono text-sm">
          {/* Left column - old code */}
          <div className="min-w-0 border-r border-slate-800">
            {sides.left.map((line, index) => (
              <div
                key={`l-${index}`}
                className={`flex items-stretch border-b border-slate-800/50 ${
                  line.value === '' ? 'bg-transparent' : line.type === 'deleted' ? 'bg-red-950/50' : 'bg-transparent'
                }`}
              >
                <span
                  className={`flex-1 whitespace-pre-wrap break-all px-3 py-1 ${
                    line.value === ''
                      ? 'text-slate-700'
                      : line.type === 'deleted'
                        ? 'text-red-300'
                        : 'text-slate-400'
                  }`}
                >
                  {line.value || ' '}
                </span>
              </div>
            ))}
          </div>
          {/* Right column - new code */}
          <div className="min-w-0">
            {sides.right.map((line, index) => (
              <div
                key={`r-${index}`}
                className={`flex items-stretch border-b border-slate-800/50 ${
                  line.value === '' ? 'bg-transparent' : line.type === 'added' ? 'bg-emerald-950/50' : 'bg-transparent'
                }`}
              >
                <span
                  className={`flex-1 whitespace-pre-wrap break-all px-3 py-1 ${
                    line.value === ''
                      ? 'text-slate-700'
                      : line.type === 'added'
                        ? 'text-emerald-200'
                        : 'text-slate-400'
                  }`}
                >
                  {line.value || ' '}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default DiffViewer;