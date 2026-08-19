import { motion } from 'framer-motion';
import { memo } from 'react';
import { Link } from 'react-router-dom';

const getLangIcon = (lang) => {
  const l = String(lang || '').toLowerCase();
  if (l.includes('python') || l === 'py') return '🐍 Python';
  if (l.includes('java') && !l.includes('script')) return '☕ Java';
  if (l.includes('c++') || l.includes('cpp') || l === 'c') return '⚡ C++';
  if (l.includes('script') || l === 'js' || l === 'ts') return '🟨 JavaScript';
  if (l === 'sql') return '🗄️ SQL';
  return lang;
};

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Hard':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'Medium':
    default:
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }
};

const SnippetCard = memo(function SnippetCard({ snippet }) {
  const isSql = snippet.domain === 'sql' || snippet.language === 'sql';

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-5 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-blue-500/5"
    >
      <div>
        {/* Top Badges: Domain, Difficulty, Topic & Version */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-bold border ${
                isSql
                  ? 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-600/15 text-blue-400 border-blue-500/30'
              }`}
            >
              {isSql ? '🗄️ SQL' : '🧠 DSA'}
            </span>

            {snippet.difficulty && (
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${getDifficultyClass(snippet.difficulty)}`}>
                {snippet.difficulty}
              </span>
            )}

            {snippet.topic && snippet.topic !== 'General' && (
              <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60">
                {snippet.topic}
              </span>
            )}
          </div>

          <span className="shrink-0 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-400 border border-slate-700/60">
            v{snippet.currentVersion}
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/snippet/${snippet._id}`}
          className="text-base font-bold text-white transition-colors group-hover:text-blue-400 line-clamp-1"
        >
          {snippet.title}
        </Link>

        {/* Target Complexity or Description */}
        {snippet.targetTimeComplexity ? (
          <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="text-slate-500">Target:</span>
            <span className="rounded bg-slate-950 px-1.5 py-0.5 text-blue-300 border border-slate-800">
              ⏱ {snippet.targetTimeComplexity}
            </span>
            {snippet.targetSpaceComplexity && (
              <span className="rounded bg-slate-950 px-1.5 py-0.5 text-indigo-300 border border-slate-800">
                💾 {snippet.targetSpaceComplexity}
              </span>
            )}
          </div>
        ) : snippet.description ? (
          <p className="mt-2 line-clamp-2 text-xs text-slate-400 leading-relaxed">{snippet.description}</p>
        ) : null}

        {/* Tags */}
        {(snippet.tags || []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {snippet.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-800/80">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Language Icon, Author, Date */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-500">
        <span className="rounded bg-slate-950 px-2 py-1 font-mono text-[11px] text-slate-300 border border-slate-800">
          {getLangIcon(snippet.language)}
        </span>

        <div className="flex items-center gap-2">
          {snippet.owner?.avatar && (
            <img
              src={snippet.owner.avatar}
              alt={snippet.owner.name}
              className="h-5 w-5 rounded-full object-cover border border-slate-700"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span className="max-w-[100px] truncate text-[11px]">{snippet.owner?.name || 'Dev'}</span>
        </div>
      </div>
    </motion.article>
  );
});

export default SnippetCard;