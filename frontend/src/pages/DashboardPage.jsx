import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { SnippetGridSkeleton } from '../components/LoadingSkeleton.jsx';
import Navbar from '../components/Navbar.jsx';
import Pagination from '../components/Pagination.jsx';
import SnippetCard from '../components/SnippetCard.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import api from '../services/api.js';

const LANGUAGES = ['javascript', 'python', 'sql', 'dsa', 'java', 'c', 'c++', 'cpp', 'json', 'markdown', 'html', 'css', 'typescript'];

export default function DashboardPage() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);

  const fetchSnippets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (language) params.set('language', language);
      if (tag) params.set('tag', tag);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await api.get('/search/public', { params });
      setSnippets(res.data.snippets);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (_error) {
      setSnippets([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, language, tag, page]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, language, tag]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Explore public snippets from the community.</p>
        </motion.div>

        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:flex-row"
        >
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21 L16.65 16.65" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snippets by title, tag…"
              className="w-full rounded-md border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Filter by tag"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </motion.div>

        {/* Results */}
        {loading ? (
          <SnippetGridSkeleton count={6} />
        ) : snippets.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-sm text-slate-400">No snippets found. Try adjusting your search.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
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