import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SnippetGridSkeleton } from '../components/LoadingSkeleton.jsx';
import Navbar from '../components/Navbar.jsx';
import Pagination from '../components/Pagination.jsx';
import SnippetCard from '../components/SnippetCard.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import api from '../services/api.js';
import {
  DSA_LANGUAGES,
  SQL_LANGUAGES,
  DSA_TOPICS,
  SQL_TOPICS,
  DIFFICULTIES,
} from '../utils/languages.js';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const domainFromUrl = searchParams.get('domain') || '';

  const [domain, setDomain] = useState(domainFromUrl);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync domain state with URL
  useEffect(() => {
    setDomain(domainFromUrl);
    setPage(1);
  }, [domainFromUrl]);

  const debouncedSearch = useDebouncedValue(search, 300);

  const handleDomainChange = (newDomain) => {
    setDomain(newDomain);
    setSelectedTopic('');
    setLanguage('');
    setPage(1);
    if (newDomain) {
      setSearchParams({ domain: newDomain });
    } else {
      setSearchParams({});
    }
  };

  const fetchSnippets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (domain) params.set('domain', domain);
      if (language) params.set('language', language);
      if (difficulty) params.set('difficulty', difficulty);
      if (selectedTopic) params.set('topic', selectedTopic);
      if (tag) params.set('tag', tag);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await api.get('/search/public', { params });
      setSnippets(res.data.snippets || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (_error) {
      setSnippets([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, domain, language, difficulty, selectedTopic, tag, page]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, language, difficulty, selectedTopic, tag]);

  const activeTopics = domain === 'sql' ? SQL_TOPICS : domain === 'dsa' ? DSA_TOPICS : [...DSA_TOPICS.slice(0, 6), ...SQL_TOPICS.slice(0, 4)];
  const availableLanguages = domain === 'sql' ? SQL_LANGUAGES : domain === 'dsa' ? DSA_LANGUAGES : [...DSA_LANGUAGES, ...SQL_LANGUAGES];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header with Domain Tabs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {domain === 'dsa'
                  ? 'DSA Arena'
                  : domain === 'sql'
                  ? 'SQL Studio'
                  : 'DSA & SQL Problem Hub'}
              </h1>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {domain === 'dsa'
                  ? 'Algorithmic problem-solving in Java, Python, C++, and JavaScript.'
                  : domain === 'sql'
                  ? 'Database query practice, window functions, CTEs, and execution optimization.'
                  : 'Version-controlled DSA and SQL practice for technical interviews.'}
              </p>
            </div>

            {/* Domain Switcher */}
            <div className="flex rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                type="button"
                onClick={() => handleDomainChange('')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  !domain ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Problems
              </button>
              <button
                type="button"
                onClick={() => handleDomainChange('dsa')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  domain === 'dsa' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                DSA Arena
              </button>
              <button
                type="button"
                onClick={() => handleDomainChange('sql')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  domain === 'sql' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                SQL Studio
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pattern & Topic Filter Chips */}
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">Patterns:</span>
          <button
            type="button"
            onClick={() => setSelectedTopic('')}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
              !selectedTopic
                ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/40 font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Topics
          </button>
          {activeTopics.map((top) => (
            <button
              key={top}
              type="button"
              onClick={() => setSelectedTopic(selectedTopic === top ? '' : top)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
                selectedTopic === top
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {top}
            </button>
          ))}
        </div>

        {/* Search + Dropdowns */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 grid gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:grid-cols-[1fr_auto_auto_auto] shadow-sm"
        >
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21 L16.65 16.65" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems, patterns, constraints..."
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Languages</option>
            {availableLanguages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag (e.g. leetcode)"
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </motion.div>

        {/* Problem List */}
        {loading ? (
          <SnippetGridSkeleton count={6} />
        ) : snippets.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-300">No problems found</p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search query, difficulty, or pattern filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {snippets.map((snippet) => (
                  <SnippetCard key={snippet._id} snippet={snippet} />
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}