import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { SnippetGridSkeleton } from './components/LoadingSkeleton.jsx';
import { AuthProvider } from './store/AuthContext.jsx';

// Code-split each page so only the active route's bundle is loaded.
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const SnippetPage = lazy(() => import('./pages/SnippetPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const CreatePage = lazy(() => import('./pages/CreatePage.jsx'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <SnippetGridSkeleton count={6} />
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/snippet/:id" element={<SnippetPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreatePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AnimatedRoutes />
    </AuthProvider>
  );
}