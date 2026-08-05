import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import GoogleLoginButton from './GoogleLoginButton.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timeoutRef = useRef(null);

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
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18.5 L6 21 L7 14 L2 9 L9 8 Z" className="text-blue-400" />
          </svg>
          CodeTrail
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/" className="rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white">
            Dashboard
          </Link>
          {user && (
            <Link to="/create" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
              New Snippet
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
  className="h-8 w-8 rounded-full object-cover border border-slate-700"
  onError={(e) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "User"
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
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-lg"
                  >
                    <div className="border-b border-slate-800 px-4 py-3">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="truncate text-xs text-slate-400">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-slate-800"
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
        <button
          type="button"
          className="rounded-md p-2 text-slate-300 transition-colors hover:bg-slate-800 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? <path d="M6 6 L18 18 M18 6 L6 18" /> : <path d="M4 7 H20 M4 12 H20 M4 17 H20" />}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Dashboard
              </Link>
              {user && (
                <Link to="/create" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                  New Snippet
                </Link>
              )}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                    Profile
                  </Link>
                  <button type="button" onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-800">
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