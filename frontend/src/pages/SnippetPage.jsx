import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor.jsx';
import DiffViewer from '../components/DiffViewer.jsx';
import { CodeEditorSkeleton } from '../components/LoadingSkeleton.jsx';
import Navbar from '../components/Navbar.jsx';
import VersionHistory from '../components/VersionHistory.jsx';
import api from '../services/api.js';
import { useAuth } from '../store/AuthContext.jsx';

const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'c',
  'sql',
  'json',
  'html',
  'css',
  'markdown',
];

function extractErrorLines(errors = []) {
  if (!Array.isArray(errors) || errors.length === 0) return [];
  const lineNumbers = new Set();
  const lineRegex = /line\s*[:#]?\s*(\d+)/gi;
  errors.forEach((error) => {
    const text = typeof error === 'object' && error?.line ? `line ${error.line}` : String(error);
    let match;
    while ((match = lineRegex.exec(text)) !== null) {
      const num = Number(match[1]);
      if (Number.isFinite(num) && num > 0) lineNumbers.add(num);
    }
  });
  return Array.from(lineNumbers).sort((a, b) => a - b);
}

export default function SnippetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [snippet, setSnippet] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentCode, setCurrentCode] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [codeLoaded, setCodeLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [versionLoading, setVersionLoading] = useState(false);

  // Edit Mode state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLanguage, setEditLanguage] = useState('javascript');
  const [editTags, setEditTags] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editCode, setEditCode] = useState('');
  const [editCommitMessage, setEditCommitMessage] = useState('');
  const [editProblemStatement, setEditProblemStatement] = useState('');
  const [editCodingPlatformMode, setEditCodingPlatformMode] = useState(false);

  const [error, setError] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownActive = cooldownLeft > 0;

  // Coding Platform Mode state
  const [codingPlatformMode, setCodingPlatformMode] = useState(false);
  const [problemStatement, setProblemStatement] = useState('');
  const [showProblemStatement, setShowProblemStatement] = useState(true);

  // Active generated code tab
  const [activeCodeTab, setActiveCodeTab] = useState('optimized'); // 'optimized' | 'corrected'
  const [copiedCode, setCopiedCode] = useState(false);

  // Diff comparison states
  const [compareFrom, setCompareFrom] = useState(null);
  const [compareTo, setCompareTo] = useState(null);

  // Live countdown for the AI request cooldown
  useEffect(() => {
    if (!cooldownActive) return undefined;
    const timer = setInterval(() => {
      setCooldownLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownActive]);

  const isOwner = useMemo(() => user && snippet && user.id === snippet.owner?._id, [user, snippet]);
  const canAnalyze = useMemo(() => Boolean(user), [user]);

  const errorLines = useMemo(() => {
    if (Array.isArray(analysis?.errorLines) && analysis.errorLines.length > 0) {
      return analysis.errorLines;
    }
    return extractErrorLines(analysis?.issues || analysis?.errors || analysis?.analysisErrors);
  }, [analysis?.errorLines, analysis?.issues, analysis?.errors, analysis?.analysisErrors]);

  const hasErrors =
    Boolean(analysis?.hasSyntaxErrors) ||
    (analysis?.issues?.length > 0) ||
    (analysis?.errors?.length > 0) ||
    (analysis?.analysisErrors?.length > 0);

  const loadSnippet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/snippets/${id}`);
      setSnippet(res.data.snippet);
      if (res.data.snippet?.problemStatement) {
        setProblemStatement(res.data.snippet.problemStatement);
        setEditProblemStatement(res.data.snippet.problemStatement);
        setCodingPlatformMode(true);
        setEditCodingPlatformMode(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load snippet');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadVersions = useCallback(async () => {
    try {
      const res = await api.get(`/versions/${id}/history`);
      setVersions(res.data.versions || []);
      if (res.data.versions?.length > 0) {
        const latest = res.data.versions[res.data.versions.length - 1];
        setSelectedVersion(latest.versionNumber);
      }
    } catch (_error) {
      // Versions are optional for anonymous viewers
    }
  }, [id]);

  const loadLikeStatus = useCallback(async () => {
    try {
      const res = await api.get(`/likes/${id}`);
      setLikeCount(res.data.count || 0);
      setLiked(Boolean(res.data.liked));
    } catch (_error) {
      setLikeCount(0);
      setLiked(false);
    }
  }, [id]);

  const loadComments = useCallback(async (page = 1) => {
    try {
      const res = await api.get(`/comments/${id}`, {
        params: { page, limit: 5 },
      });
      setComments(res.data.comments || []);
      setCommentPage(res.data.pagination?.page || 1);
      setCommentTotalPages(res.data.pagination?.totalPages || 1);
    } catch (_error) {
      setComments([]);
      setCommentPage(1);
      setCommentTotalPages(1);
    }
  }, [id]);

  useEffect(() => {
    loadSnippet();
    loadVersions();
    loadLikeStatus();
    loadComments(1);
  }, [loadSnippet, loadVersions, loadLikeStatus, loadComments]);

  useEffect(() => {
    if (!selectedVersion || loading) return;
    setCodeLoaded(false);
    setVersionLoading(true);
    api
      .get(`/versions/${id}/version/${selectedVersion}`)
      .then((res) => {
        const code = res.data.version?.fullCode || '';
        setCurrentCode(code);
        setAnalysis(null);
        setCompareFrom(null);
        setCompareTo(null);
      })
      .catch((_err) => {
        setCurrentCode('');
        setAnalysis(null);
      })
      .finally(() => {
        setVersionLoading(false);
        setCodeLoaded(true);
      });
  }, [id, selectedVersion, loading]);

  const handleStartEdit = () => {
    if (!snippet) return;
    setEditTitle(snippet.title || '');
    setEditDescription(snippet.description || '');
    setEditLanguage(snippet.language || 'javascript');
    setEditTags(Array.isArray(snippet.tags) ? snippet.tags.join(', ') : '');
    setEditIsPublic(snippet.isPublic !== false);
    setEditProblemStatement(snippet.problemStatement || '');
    setEditCodingPlatformMode(Boolean(snippet.problemStatement));
    setEditCode(currentCode);
    setEditCommitMessage('');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!isOwner || !editCommitMessage.trim()) return;
    try {
      await api.put(`/snippets/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        language: editLanguage.trim().toLowerCase(),
        tags: editTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        isPublic: editIsPublic,
        code: editCode,
        commitMessage: editCommitMessage.trim(),
        problemStatement: editCodingPlatformMode ? editProblemStatement.trim() : '',
      });
      setEditing(false);
      setEditCommitMessage('');
      await Promise.all([loadSnippet(), loadVersions()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save version');
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) {
      setError('Please sign in to run AI code analysis.');
      return;
    }
    if (!currentCode.trim()) return;
    if (cooldownActive) return;

    if (codingPlatformMode && !problemStatement.trim()) {
      setError('Please paste the problem statement before running coding-platform analysis.');
      return;
    }

    try {
      setAnalysisLoading(true);
      const res = await api.post('/analysis/analyze', {
        code: currentCode,
        language: snippet?.language || 'javascript',
        snippetId: id,
        versionNumber: selectedVersion || snippet?.currentVersion || 1,
        codingPlatformMode,
        problemStatement: codingPlatformMode ? problemStatement.trim() : '',
      });
      setAnalysis(res.data);
      if (res.data.optimizedCode) {
        setActiveCodeTab('optimized');
      } else if (res.data.correctedCode) {
        setActiveCodeTab('corrected');
      }
      setError('');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'AI analysis failed. Please try again.';
      if (status === 429) {
        const match = message.match(/(\d+)\s*seconds/);
        setCooldownLeft(match ? Number(match[1]) : 10);
        setError('Please wait before requesting AI analysis again.');
      } else {
        setError(message);
      }
    } finally {
      setAnalysisLoading(false);
    }
  }, [canAnalyze, currentCode, snippet?.language, snippet?.currentVersion, id, selectedVersion, cooldownActive, codingPlatformMode, problemStatement]);

  const handleCopyCode = (codeText) => {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFork = async () => {
    if (!user) return;
    try {
      const res = await api.post(`/snippets/${id}/fork`);
      navigate(`/snippet/${res.data.snippet._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fork snippet');
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      setError('Please sign in to like this snippet.');
      return;
    }
    try {
      const res = liked ? await api.delete(`/likes/${id}`) : await api.post(`/likes/${id}`);
      setLikeCount(res.data.count || 0);
      setLiked(Boolean(res.data.liked));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update snippet like state');
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      setError('Please sign in to comment on this snippet.');
      return;
    }
    const text = commentInput.trim();
    if (!text) {
      setError('Comment text is required.');
      return;
    }
    try {
      setCommentSubmitting(true);
      const res = await api.post(`/comments/${id}`, { text });
      setCommentInput('');
      setComments((current) => [res.data.comment, ...current]);
      await loadComments(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      await loadComments(commentPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    if (!window.confirm('Delete this snippet permanently?')) return;
    try {
      await api.delete(`/snippets/${id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete snippet');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-6 h-8 w-64 rounded bg-slate-800 animate-pulse" />
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <CodeEditorSkeleton />
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-4 h-4 w-28 rounded bg-slate-800 animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-3 h-4 w-full rounded bg-slate-800 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !snippet) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Snippet Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{snippet.title}</h1>
                <span className="rounded-full bg-slate-800 px-3 py-1 font-mono text-xs text-slate-300">
                  {snippet.language}
                </span>
                <span className="rounded-full bg-blue-600/15 border border-blue-500/30 px-3 py-0.5 font-mono text-xs text-blue-400">
                  v{snippet.currentVersion}
                </span>
                {!snippet.isPublic && (
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs text-amber-400">
                    Private
                  </span>
                )}
              </div>

              {snippet.description && (
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{snippet.description}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {snippet.owner?.avatar && (
                  <img
                    src={snippet.owner.avatar}
                    alt={snippet.owner.name}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                )}
                <span className="text-slate-300 font-medium">{snippet.owner?.name || 'Unknown'}</span>
                <span>·</span>
                <span>{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                {snippet.forkInfo?.forkedFrom && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 3v12 M6 3a3 3 0 1 0 0 6 M18 21a3 3 0 1 0 0-6 M6 15a3 3 0 0 0 3 3h9" />
                    </svg>
                    forked from {snippet.forkInfo.forkedFrom}
                  </span>
                )}
              </div>

              {snippet.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-xs text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2">
              {isOwner ? (
                <>
                  {!editing && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 shadow-sm"
                    >
                      Edit Snippet
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-950/40"
                  >
                    Delete
                  </button>
                </>
              ) : (
                user && (
                  <button
                    type="button"
                    onClick={handleFork}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 3v12 M6 3a3 3 0 1 0 0 6 M18 21a3 3 0 1 0 0-6 M6 15a3 3 0 0 0 3 3h9" />
                    </svg>
                    Fork
                  </button>
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* Problem Statement Display (if present and not editing) */}
        {!editing && snippet.problemStatement && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 text-blue-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Problem Statement / Constraints
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowProblemStatement((prev) => !prev)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {showProblemStatement ? 'Hide' : 'Show'}
              </button>
            </div>
            {showProblemStatement && (
              <p className="mt-2.5 whitespace-pre-wrap font-mono text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                {snippet.problemStatement}
              </p>
            )}
          </div>
        )}

        {/* EDIT MODE */}
        {editing && isOwner ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-white">Edit Snippet & Create Version {snippet.currentVersion + 1}</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Language</label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Visibility</label>
                <select
                  value={String(editIsPublic)}
                  onChange={(e) => setEditIsPublic(e.target.value === 'true')}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </div>
            </div>

            {/* Coding Platform Mode inside Edit */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">Coding Platform Mode</p>
                  <p className="text-[11px] text-slate-500">Include problem statement for DSA analysis & hints.</p>
                </div>
                <input
                  type="checkbox"
                  checked={editCodingPlatformMode}
                  onChange={(e) => setEditCodingPlatformMode(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
              </div>
              {editCodingPlatformMode && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-slate-300">Problem Statement</label>
                  <textarea
                    value={editProblemStatement}
                    onChange={(e) => setEditProblemStatement(e.target.value)}
                    rows={3}
                    placeholder="Paste problem description here..."
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Code</label>
              <CodeEditor value={editCode} onChange={setEditCode} language={editLanguage} height="360px" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Commit Message / Version Note <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={editCommitMessage}
                onChange={(e) => setEditCommitMessage(e.target.value)}
                placeholder="e.g. Optimized inner loop to use HashMap (required)"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editCommitMessage.trim()}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              >
                Save Version {snippet.currentVersion + 1}
              </button>
            </div>
          </motion.div>
        ) : (
          /* VIEW MODE */
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Main Area: Code / Diff + AI Analysis */}
            <div className="min-w-0 space-y-6">
              {/* Diff Viewer Mode */}
              {compareFrom && compareTo ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">Version Diff</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <select
                          value={compareFrom}
                          onChange={(e) => setCompareFrom(Number(e.target.value))}
                          className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                        >
                          {versions.map((v) => (
                            <option key={`from-${v.versionNumber}`} value={v.versionNumber}>
                              v{v.versionNumber}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const tmp = compareFrom;
                            setCompareFrom(compareTo);
                            setCompareTo(tmp);
                          }}
                          title="Swap versions"
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          ⇄
                        </button>
                        <select
                          value={compareTo}
                          onChange={(e) => setCompareTo(Number(e.target.value))}
                          className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                        >
                          {versions.map((v) => (
                            <option key={`to-${v.versionNumber}`} value={v.versionNumber}>
                              v{v.versionNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCompareFrom(null);
                        setCompareTo(null);
                      }}
                      className="rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      Close Diff
                    </button>
                  </div>

                  <RenderCompare snippetId={id} baseVersion={compareFrom} compareVersion={compareTo} />
                </div>
              ) : (
                /* Standard Code Editor View */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-medium text-slate-300">
                        {versionLoading ? 'Loading…' : `Code (v${selectedVersion || snippet.currentVersion})`}
                      </h2>
                    </div>

                    {versions.length > 1 && selectedVersion && (
                      <button
                        type="button"
                        onClick={() => {
                          const latest = versions[versions.length - 1]?.versionNumber;
                          if (latest && latest !== selectedVersion) {
                            setCompareFrom(selectedVersion);
                            setCompareTo(latest);
                          } else {
                            const prev = versions[versions.length - 2]?.versionNumber;
                            if (prev) {
                              setCompareFrom(prev);
                              setCompareTo(selectedVersion);
                            }
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs text-blue-400 transition-colors hover:text-blue-300"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="18" r="3" />
                          <circle cx="6" cy="6" r="3" />
                          <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                          <line x1="6" y1="9" x2="6" y2="21" />
                        </svg>
                        Compare Diff
                      </button>
                    )}
                  </div>

                  {versionLoading || !codeLoaded ? (
                    <CodeEditorSkeleton />
                  ) : (
                    <div className={`grid gap-3 ${hasErrors ? 'lg:grid-cols-[1fr_240px]' : 'grid-cols-1'}`}>
                      <CodeEditor
                        value={currentCode}
                        language={snippet.language}
                        height="480px"
                        readOnly
                        errorLines={errorLines}
                      />

                      {/* Error & Issue Sidebar if errors detected */}
                      {hasErrors && (
                        <aside className="max-h-[480px] overflow-auto rounded-xl border border-rose-900/50 bg-rose-950/20 p-3.5 space-y-2.5">
                          <div className="flex items-center gap-2 border-b border-rose-900/40 pb-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                              Issues Detected ({analysis?.issues?.length || errorLines.length || 1})
                            </h3>
                          </div>

                          <div className="space-y-2">
                            {analysis?.issues?.length > 0 ? (
                              analysis.issues.map((iss, index) => (
                                <div
                                  key={`iss-${index}`}
                                  className="rounded-lg border border-rose-900/40 bg-rose-950/40 p-2.5 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                        iss.severity === 'Critical'
                                          ? 'bg-rose-600 text-white'
                                          : iss.severity === 'High'
                                          ? 'bg-orange-600 text-white'
                                          : 'bg-amber-600 text-slate-900'
                                      }`}
                                    >
                                      {iss.severity}
                                    </span>
                                    {iss.line && (
                                      <span className="font-mono text-[10px] text-rose-300">
                                        Line {iss.line}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-rose-200">{iss.title}</p>
                                  {iss.description && (
                                    <p className="mt-1 text-slate-300 leading-snug">{iss.description}</p>
                                  )}
                                  {iss.fix && (
                                    <p className="mt-1.5 rounded bg-slate-950/60 p-1.5 text-[11px] text-emerald-300 font-mono">
                                      💡 {iss.fix}
                                    </p>
                                  )}
                                </div>
                              ))
                            ) : (
                              (analysis?.errors || analysis?.analysisErrors || []).map((errText, index) => (
                                <div
                                  key={`err-${index}`}
                                  className="rounded-lg border border-rose-900/40 bg-rose-950/40 p-2.5 text-xs text-rose-200"
                                >
                                  {errText}
                                </div>
                              ))
                            )}
                          </div>
                        </aside>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI CODE ANALYSIS & MENTOR SECTION */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                      🧠
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-white">AI Code Review & Mentor</h2>
                      <p className="text-xs text-slate-400">
                        {codingPlatformMode
                          ? 'Algorithmic feedback & progressive hints'
                          : 'Deep review, Big-O complexity, scores, and fixes'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analysisLoading || cooldownActive}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                  >
                    {analysisLoading
                      ? 'Analyzing…'
                      : cooldownActive
                      ? `Wait ${cooldownLeft}s`
                      : analysis
                      ? 'Re-analyze'
                      : codingPlatformMode
                      ? 'Get Hints'
                      : 'Explain Code'}
                  </button>
                </div>

                {/* Mode Switcher Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div>
                    <span className="text-xs font-medium text-slate-200">Coding Platform Mode</span>
                    <p className="text-[11px] text-slate-500">
                      Toggle to provide LeetCode / DSA problem statements and receive tiered hints.
                    </p>
                  </div>
                  <label className="relative inline-flex h-5 w-10 cursor-pointer items-center rounded-full">
                    <input
                      type="checkbox"
                      checked={codingPlatformMode}
                      onChange={(e) => {
                        setCodingPlatformMode(e.target.checked);
                        setAnalysis(null);
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`h-5 w-10 rounded-full transition-colors ${
                        codingPlatformMode ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          codingPlatformMode ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </span>
                  </label>
                </div>

                {/* Problem Statement Box when Coding Platform Mode is on */}
                {codingPlatformMode && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Problem Statement / Constraints
                    </label>
                    <textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      rows={3}
                      placeholder="Paste the problem description, example cases, and constraints here..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Loading / Cooldown / Results display */}
                {analysisLoading ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <p className="text-xs text-slate-400">
                      {codingPlatformMode
                        ? 'Analyzing problem constraints and formulating progressive hints…'
                        : 'Evaluating code quality, complexity, security, and potential bugs…'}
                    </p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-4">
                    {/* Coding Platform Mode Output */}
                    {codingPlatformMode && analysis.isOptimal !== undefined && analysis.isOptimal !== null ? (
                      <div className="space-y-3">
                        {/* Optimal Status Banner */}
                        <div
                          className={`flex items-start gap-3 rounded-lg border p-3.5 ${
                            analysis.isOptimal
                              ? 'border-emerald-500/40 bg-emerald-950/20'
                              : 'border-amber-500/40 bg-amber-950/20'
                          }`}
                        >
                          <span className="text-xl">{analysis.isOptimal ? '✅' : '💡'}</span>
                          <div>
                            <p
                              className={`text-sm font-bold ${
                                analysis.isOptimal ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {analysis.isOptimal ? 'Optimal Approach Confirmed!' : 'Approach Can Be Optimized'}
                            </p>
                            {analysis.approachExplanation && (
                              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                {analysis.approachExplanation}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Recommended Data Structures */}
                        {analysis.recommendedDataStructures?.length > 0 && (
                          <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-3.5 space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                              Recommended Data Structures & Techniques
                            </h3>
                            <ul className="space-y-1.5 text-xs text-blue-200">
                              {analysis.recommendedDataStructures.map((ds, i) => (
                                <li key={`ds-${i}`} className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">›</span>
                                  <span>{ds}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Progressive Hints */}
                        {analysis.hints?.length > 0 && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Progressive Hints
                            </h3>
                            <div className="space-y-2">
                              {analysis.hints.map((hint, i) => (
                                <div
                                  key={`h-${i}`}
                                  className="flex items-start gap-2.5 rounded-md border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs text-slate-300"
                                >
                                  <span className="shrink-0 rounded bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                                    Hint {i + 1}
                                  </span>
                                  <span className="leading-relaxed">{hint}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Common Mistakes */}
                        {analysis.commonMistakes?.length > 0 && (
                          <div className="rounded-lg border border-rose-900/30 bg-rose-950/10 p-3.5 space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                              Common Candidate Mistakes
                            </h3>
                            <ul className="list-disc space-y-1 pl-4 text-xs text-rose-200">
                              {analysis.commonMistakes.map((cm, i) => (
                                <li key={`cm-${i}`}>{cm}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Learning Resources */}
                        {analysis.learningResources?.length > 0 && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 space-y-1.5">
                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Learning Resources
                            </h3>
                            <ul className="space-y-1 text-xs text-slate-300">
                              {analysis.learningResources.map((res, i) => (
                                <li key={`res-${i}`} className="flex items-center gap-1.5 text-blue-400">
                                  <span>📖</span>
                                  <span>{res}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Standard Code Review Output */
                      <div className="space-y-4">
                        {/* Score & Rating Overview */}
                        {analysis.overallScore > 0 && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-lg font-black text-blue-400">
                                  {analysis.overallScore}
                                  <span className="text-[10px] font-normal text-slate-400">/10</span>
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-white">Code Quality Score</h3>
                                  <p className="text-xs text-slate-400">
                                    {analysis.category} {analysis.subCategory ? `· ${analysis.subCategory}` : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Complexity badges if available */}
                              {(analysis.timeComplexity || analysis.complexity?.timeComplexity) && (
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-300">
                                    Time: {analysis.timeComplexity || analysis.complexity?.timeComplexity}
                                  </span>
                                  <span className="rounded bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-300">
                                    Space: {analysis.spaceComplexity || analysis.complexity?.spaceComplexity}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Ratings Progress Bars */}
                            {analysis.ratings && (
                              <div className="mt-3 grid gap-2 sm:grid-cols-5">
                                {Object.entries(analysis.ratings).map(([key, val]) => (
                                  <div key={key} className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 capitalize">
                                      <span>{key}</span>
                                      <span className="font-semibold text-slate-300">{val}/10</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          val >= 8 ? 'bg-emerald-500' : val >= 6 ? 'bg-blue-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${Math.min(100, val * 10)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {analysis.summary && (
                              <p className="mt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                                {analysis.summary}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Explanation */}
                        {analysis.explanation && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                              Analysis Overview
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed">{analysis.explanation}</p>
                          </div>
                        )}

                        {/* Strengths */}
                        {analysis.strengths?.length > 0 && (
                          <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/15 p-3.5 space-y-1.5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                              Strengths & Best Practices
                            </h3>
                            <ul className="space-y-1 text-xs text-emerald-200">
                              {analysis.strengths.map((st, i) => (
                                <li key={`st-${i}`} className="flex items-start gap-2">
                                  <span className="text-emerald-400 font-bold">✓</span>
                                  <span>{st}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggestions */}
                        {analysis.suggestions?.length > 0 && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Recommendations & Improvements
                            </h3>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                              {analysis.suggestions.map((sg, i) => (
                                <li key={`sg-${i}`} className="flex items-start gap-2">
                                  <span className="text-blue-400 font-bold">▸</span>
                                  <span>{sg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Code Generation Tabs (Optimized vs Corrected) */}
                        {(analysis.optimizedCode || analysis.correctedCode) && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-1.5">
                              <div className="flex gap-2">
                                {analysis.optimizedCode && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveCodeTab('optimized')}
                                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                                      activeCodeTab === 'optimized'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Optimized Solution
                                  </button>
                                )}
                                {analysis.correctedCode && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveCodeTab('corrected')}
                                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                                      activeCodeTab === 'corrected'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Corrected Code
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyCode(
                                    activeCodeTab === 'optimized'
                                      ? analysis.optimizedCode
                                      : analysis.correctedCode
                                  )
                                }
                                className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                              >
                                {copiedCode ? '✓ Copied' : 'Copy Code'}
                              </button>
                            </div>

                            <pre className="max-h-[320px] overflow-auto p-3.5 font-mono text-xs text-slate-200 leading-relaxed select-text">
                              <code>
                                {activeCodeTab === 'optimized'
                                  ? analysis.optimizedCode
                                  : analysis.correctedCode}
                              </code>
                            </pre>
                          </div>
                        )}

                        {/* Interview Questions */}
                        {analysis.interviewQuestions?.length > 0 && (
                          <div className="rounded-lg border border-purple-900/30 bg-purple-950/15 p-3.5 space-y-1.5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                              Technical Interview Questions
                            </h3>
                            <ul className="space-y-1.5 text-xs text-purple-200">
                              {analysis.interviewQuestions.map((iq, i) => (
                                <li key={`iq-${i}`} className="flex items-start gap-2">
                                  <span className="text-purple-400 font-bold">?</span>
                                  <span>{iq}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty state placeholder */
                  <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-400">
                    <p className="font-medium text-slate-300">No analysis performed for this version yet.</p>
                    <p className="mt-1 text-slate-500">
                      {codingPlatformMode
                        ? 'Paste the problem statement and click "Get Hints" for algorithmic feedback.'
                        : 'Click "Explain Code" to generate comprehensive code review, scoring, and fixes.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Version History & Feedback */}
            <div className="min-w-0 space-y-4">
              <VersionHistory
                versions={versions}
                selectedVersion={selectedVersion}
                onSelect={(versionNumber) => {
                  setSelectedVersion(versionNumber);
                  setCompareFrom(null);
                  setCompareTo(null);
                }}
              />

              {/* Community Feedback Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Community Feedback
                  </h2>
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      liked
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{liked ? '❤️' : '🤍'}</span>
                    <span>{likeCount}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    rows={2}
                    placeholder="Share feedback or ask questions..."
                    className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{comments.length} comments</span>
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={commentSubmitting || !commentInput.trim()}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {commentSubmitting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {comments.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-2">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment._id}
                        className="rounded-lg border border-slate-800/80 bg-slate-950 p-2.5 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            {comment.userId?.avatar && (
                              <img
                                src={comment.userId.avatar}
                                alt={comment.userId.name}
                                className="h-4 w-4 rounded-full object-cover"
                              />
                            )}
                            <span className="font-medium text-slate-300">{comment.userId?.name || 'Unknown'}</span>
                          </div>
                          {user?.id === comment.userId?._id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-slate-300 leading-snug">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {commentTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => loadComments(Math.max(1, commentPage - 1))}
                      disabled={commentPage === 1}
                      className="rounded border border-slate-700 px-2 py-0.5 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span>{commentPage} / {commentTotalPages}</span>
                    <button
                      type="button"
                      onClick={() => loadComments(Math.min(commentTotalPages, commentPage + 1))}
                      disabled={commentPage === commentTotalPages}
                      className="rounded border border-slate-700 px-2 py-0.5 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-md bg-red-950/40 p-3 text-xs text-red-400 border border-red-900/40">{error}</p>}
      </main>
    </div>
  );
}

function RenderCompare({ snippetId, baseVersion, compareVersion }) {
  const [codes, setCodes] = useState({ baseCode: '', comparedCode: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/versions/${snippetId}/compare/${baseVersion}/${compareVersion}`)
      .then((res) => {
        setCodes(res.data);
      })
      .catch((_err) => {
        setCodes({ baseCode: '', comparedCode: '' });
      })
      .finally(() => setLoading(false));
  }, [snippetId, baseVersion, compareVersion]);

  if (loading) return <CodeEditorSkeleton />;

  return (
    <AnimatePresence mode="wait">
      <DiffViewer
        oldCode={codes.baseCode}
        newCode={codes.comparedCode}
        oldTitle={`v${baseVersion}`}
        newTitle={`v${compareVersion}`}
      />
    </AnimatePresence>
  );
}
