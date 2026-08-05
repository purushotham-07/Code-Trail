import { Navigate } from 'react-router-dom';
import { SnippetGridSkeleton } from './LoadingSkeleton.jsx';
import { useAuth } from '../store/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // While restoring the session, show a skeleton instead of flashing a redirect.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <SnippetGridSkeleton count={4} />
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
}