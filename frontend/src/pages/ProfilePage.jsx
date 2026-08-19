import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Pagination from '../components/Pagination.jsx';
import { SnippetGridSkeleton } from '../components/LoadingSkeleton.jsx';
import SnippetCard from '../components/SnippetCard.jsx';
import api from '../services/api.js';
import { useAuth } from '../store/AuthContext.jsx';

const statCards = [
  { key: 'totalSnippets', label: 'Problems & Solutions', icon: 'M13 2 L22 7 L22 17 L13 22 L4 17 L4 7 Z' },
  { key: 'totalForks', label: 'Community Forks', icon: 'M6 3v12 M6 3a3 3 0 1 0 0 6 M18 21a3 3 0 1 0 0-6 M6 15a3 3 0 0 0 3 3h9' },
  { key: 'publicSnippets', label: 'Public Solutions', icon: 'M12 2 L15 8 L22 9 L17 14 L18 21 L12 18.5 L6 21 L7 14 L2 9 L9 8 Z' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalSnippets: 0, totalForks: 0, publicSnippets: 0 });
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, snippetsRes] = await Promise.all([
        api.get('/users/me/stats'),
        api.get(`/snippets/user?page=${page}&limit=9`),
      ]);
      setStats(statsRes.data.stats || { totalSnippets: 0, totalForks: 0, publicSnippets: 0 });
      setSnippets(snippetsRes.data.snippets || []);
      setTotalPages(snippetsRes.data.pagination?.totalPages || 1);
    } catch (_error) {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center gap-5 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md"
        >
          <img
            src={user?.avatar}
            alt={user?.name}
            className="h-20 w-20 rounded-full border-2 border-slate-700 object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || 'User'
              )}&background=2563eb&color=ffffff`;
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{user?.name}</h1>
              <span className="rounded bg-blue-600/20 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/30">
                DSA & SQL Solver
              </span>
            </div>
            <p className="truncate text-xs text-slate-400 mt-0.5">{user?.email}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={stat.icon} />
                </svg>
              </span>
              <div>
                <p className="text-2xl font-black text-white">{stats[stat.key] || 0}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* User problems & solutions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
          <h2 className="text-lg font-bold text-white">Your DSA & SQL Problems</h2>
        </motion.div>

        {loading ? (
          <SnippetGridSkeleton count={3} />
        ) : snippets.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-sm text-slate-400">You haven't published any problems or solutions yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snippets.map((snippet) => (
                <SnippetCard key={snippet._id} snippet={snippet} />
              ))}
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