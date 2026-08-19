import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case 'Easy':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30';
    case 'Hard':
      return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/30';
    case 'Medium':
    default:
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30';
  }
};

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
  const [viewLayout, setViewLayout] = useState('table'); // 'table' | 'grid'

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
      params.set('limit', '15');

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header with LeetCode Domain Tabs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {domain === 'dsa'
                  ? 'DSA Problem Arena'
                  : domain === 'sql'
                  ? 'SQL Query Studio'
                  : 'DSA & SQL Problemset'}
              </h1>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {domain === 'dsa'
                  ? 'Algorithmic problem-solving in Java, Python, C++, and JavaScript with version evolution.'
                  : domain === 'sql'
                  ? 'Database query practice, execution plans, CTEs, and query optimization.'
                  : 'Interactive version-controlled DSA and SQL practice for interview preparation.'}
              </p>
            </div>

            {/* Domain Switcher */}
            <div className="flex rounded-lg bg-white dark:bg-[#262626] p-1 border border-slate-200 dark:border-[#333333] shadow-sm">
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
                : 'bg-white dark:bg-[#262626] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#333333] hover:bg-slate-100 dark:hover:bg-[#333333] hover:text-slate-900 dark:hover:text-white'
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
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-semibold'
                  : 'bg-white dark:bg-[#262626] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#333333] hover:bg-slate-100 dark:hover:bg-[#333333] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {top}
            </button>
          ))}
        </div>

        {/* LeetCode Search & Filter Bar + View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] p-4 shadow-sm"
        >
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
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
                className="w-full rounded-md border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Difficulty Select */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-md border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>

            {/* Language Select */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Languages</option>
              {availableLanguages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle: Table vs Grid */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] p-1 border border-slate-200 dark:border-[#3a3a3a]">
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewLayout === 'table' ? 'bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table view"
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewLayout === 'grid' ? 'bg-white dark:bg-[#262626] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid cards view"
            >
              Grid
            </button>
          </div>
        </motion.div>

        {/* Problem List */}
        {loading ? (
          <SnippetGridSkeleton count={6} />
        ) : snippets.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] p-12 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-300">No problems found</p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search query, difficulty, or pattern filters.
            </p>
          </div>
        ) : viewLayout === 'table' ? (
          /* LEETCODE PROBLEMSET TABLE VIEW */
          <div className="rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#202020] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4 w-28">Difficulty</th>
                  <th className="py-3 px-4 w-36">Topic / Pattern</th>
                  <th className="py-3 px-4 w-24">Language</th>
                  <th className="py-3 px-4 w-24 text-right">Versions</th>
                  <th className="py-3 px-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#333333]">
                {snippets.map((snip, idx) => {
                  const isSql = snip.domain === 'sql' || snip.language === 'sql';
                  return (
                    <tr
                      key={snip._id}
                      className="hover:bg-slate-50 dark:hover:bg-[#2c2c2c] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">{(page - 1) * 15 + idx + 1}</td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/snippet/${snip._id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {snip.title}
                        </Link>
                        {snip.targetTimeComplexity && (
                          <span className="font-mono text-[10px] text-slate-400 mr-2">
                            Target: {snip.targetTimeComplexity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${getDifficultyClass(snip.difficulty)}`}>
                          {snip.difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-100 dark:bg-[#333333] px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {snip.topic || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 uppercase">
                          {snip.language}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        v{snip.currentVersion}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/snippet/${snip._id}`}
                          className="rounded bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors"
                        >
                          Solve
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {snippets.map((snippet) => (
                <SnippetCard key={snippet._id} snippet={snippet} />
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-8">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <footer className="mt-12 py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
          <p className="text-[11px]">
            CodeTrail • Developed by{' '}
            <a
              href="https://github.com/purushotham-07"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
            >
              Purushotham
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}