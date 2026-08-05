import { motion } from 'framer-motion';
import { memo } from 'react';
import { Link } from 'react-router-dom';

const SnippetCard = memo(function SnippetCard({ snippet }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link to={`/snippet/${snippet._id}`} className="text-base font-medium text-white transition-colors group-hover:text-blue-400">
            {snippet.title}
          </Link>
          <p className="mt-1 text-sm text-slate-400">{snippet.language}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">v{snippet.currentVersion}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-300">{snippet.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(snippet.tags || []).slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-3 text-xs text-slate-500">
        {snippet.owner?.avatar && (
          <img src={snippet.owner.avatar} alt={snippet.owner.name} className="h-5 w-5 rounded-full object-cover" />
        )}
        <span className="truncate">{snippet.owner?.name || 'Unknown'}</span>
        <span className="ml-auto">{new Date(snippet.updatedAt).toLocaleDateString()}</span>
      </div>
    </motion.article>
  );
});

export default SnippetCard;