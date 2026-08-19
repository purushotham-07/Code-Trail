import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { useTheme } from '../store/ThemeContext.jsx';
import GoogleLoginButton from './GoogleLoginButton.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timeoutRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const currentDomain = searchParams.get('domain');

  const openMenu = () => {
    clearTimeout(timeoutRef.current);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    timeoutRef.current = setTimeout(() => setMenuOpen(false), 150);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition-opacity">
            <img src="/logo.svg" alt="CodeTrail Logo" className="h-6 w-6 rounded object-contain" />
            <span>CodeTrail</span>
            <span className="rounded bg-blue-600/15 dark:bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/30">
              DSA & SQL
            </span>
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            <Link
              to="/"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !currentDomain && location.pathname === '/'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Problems
            </Link>
            <Link
              to="/?domain=dsa"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentDomain === 'dsa'
                  ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-300'
              }`}
            >
              DSA Arena
            </Link>
            <Link
              to="/?domain=sql"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentDomain === 'sql'
                  ? 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              SQL Studio
            </Link>
          </div>
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          {/* Theme Toggle (Dark & Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark and light theme"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <span className="text-[11px] font-semibold">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {user && (
            <Link
              to="/create"
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 shadow-sm"
            >
              <span>+</span>
              <span>New Problem</span>
            </Link>
          )}

          {user ? (
            <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full p-1 transition-opacity hover:opacity-80"
                aria-label="User menu"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || 'User'
                    )}&background=2563eb&color=ffffff`;
                  }}
                />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg"
                  >
                    <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Profile & Solutions
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <GoogleLoginButton />
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6 L18 18 M18 6 L6 18" /> : <path d="M4 7 H20 M4 12 H20 M4 17 H20" />}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                All Problems
              </Link>
              <Link to="/?domain=dsa" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                DSA Arena (Java, Python, C++, JS)
              </Link>
              <Link to="/?domain=sql" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                SQL Studio
              </Link>
              {user && (
                <Link to="/create" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500">
                  + New Problem
                </Link>
              )}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Profile & Solutions
                  </Link>
                  <button type="button" onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Logout
                  </button>
                </>
              ) : (
                <div className="px-3 py-2">
                  <GoogleLoginButton />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}