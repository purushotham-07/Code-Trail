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

// Extract line numbers from AI error strings so we can highlight them
// directly inside the code editor. Handles patterns like "Line 5",
// "line: 12", "on line 7", "at line 3", etc.
function extractErrorLines(errors = []) {
  if (!Array.isArray(errors) || errors.length === 0) return [];
  const lineNumbers = new Set();
  const lineRegex = /line\s*[:#]?\s*(\d+)/gi;
  errors.forEach((error) => {
    const text = String(error);
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
  const [editing, setEditing] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
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

  // Live countdown for the AI request cooldown (429 responses from the server).
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

  // Track the version pair selected for comparison (any version vs any version).
  const [compareFrom, setCompareFrom] = useState(null);
  const [compareTo, setCompareTo] = useState(null);

  const isOwner = useMemo(() => user && snippet && user.id === snippet.owner?._id, [user, snippet]);
  const canAnalyze = useMemo(() => Boolean(user), [user]);

  // Derive line numbers from AI-detected errors so we can highlight them
  // directly inside the code editor, right beside the actual code.
  const errorLines = useMemo(
    () => extractErrorLines(analysis?.errors),
    [analysis?.errors]
  );
  const hasErrors = analysis?.errors?.length > 0;

  const loadSnippet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/snippets/${id}`);
      setSnippet(res.data.snippet);
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
      // Versions are optional for anonymous viewers.
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

  // Fetch snippet metadata and version list.
  useEffect(() => {
    loadSnippet();
    loadVersions();
    loadLikeStatus();
    loadComments(1);
  }, [loadSnippet, loadVersions, loadLikeStatus, loadComments]);

  // When a version is selected, load its full (reconstructed) code.
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

  // On-demand AI analysis — only runs when the user clicks "Explain Code".
  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) {
      setError('Please sign in to run AI code analysis.');
      return;
    }
    if (!currentCode.trim()) return;
    if (cooldownActive) return;

    try {
      setAnalysisLoading(true);
      const res = await api.post('/analysis/analyze', {
        code: currentCode,
        language: snippet?.language || 'javascript',
        snippetId: id,
        versionNumber: selectedVersion || snippet?.currentVersion || 1,
      });
      setAnalysis(res.data);
      setError('');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'AI analysis failed. Please try again.';
      if (status === 429) {
        const match = message.match(/(\d+)\s*seconds/);
        setCooldownLeft(match ? Number(match[1]) : 10);
        setError('Please wait before requesting AI analysis again.');
      } else {
        // Keep any previously generated analysis visible so the user can still
        // reference it while the AI service recovers.
        setError(message);
      }
    } finally {
      setAnalysisLoading(false);
    }
  }, [canAnalyze, currentCode, snippet?.language, snippet?.currentVersion, id, selectedVersion, cooldownActive]);

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
      const res = liked
        ? await api.delete(`/likes/${id}`)
        : await api.post(`/likes/${id}`);
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

  const handleSaveEdit = async () => {
    if (!isOwner || !commitMessage.trim()) return;
    try {
      await api.put(`/snippets/${id}`, {
        code: editCode,
        commitMessage: commitMessage.trim(),
      });
      setEditing(false);
      setCommitMessage('');
      await Promise.all([loadSnippet(), loadVersions()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save version');
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
          <div className="mb-6 h-8 w-64 rounded bg-slate-800" />
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <CodeEditorSkeleton />
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-4 h-4 w-28 rounded bg-slate-800" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-3 h-4 w-full rounded bg-slate-800" />
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
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-white">{snippet.title}</h1>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{snippet.language}</span>
                <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs text-blue-400">
                  v{snippet.currentVersion}
                </span>
                {!snippet.isPublic && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">Private</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-400">{snippet.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {snippet.owner?.avatar && (
                  <img src={snippet.owner.avatar} alt={snippet.owner.name} className="h-5 w-5 rounded-full object-cover" />
                )}
                <span>{snippet.owner?.name || 'Unknown'}</span>
                <span>{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                {snippet.forkInfo?.forkedFrom && (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 3v12 M6 3a3 3 0 1 0 0 6 M18 21a3 3 0 1 0 0-6 M6 15a3 3 0 0 0 3 3h9" />
                    </svg>
                    forked from {snippet.forkInfo.forkedFrom}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(snippet.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2">
              {isOwner ? (
                <>
                  {!editing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setEditCode(currentCode);
                      }}
                      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md border border-red-900/50 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-950/40"
                  >
                    Delete
                  </button>
                </>
              ) : (
                user && (
                  <button
                    type="button"
                    onClick={handleFork}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
                  >
                    Fork
                  </button>
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* Edit mode */}
        {editing && isOwner ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <CodeEditor value={editCode} onChange={setEditCode} language={snippet.language} height="360px" />
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message (required)"
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!commitMessage.trim()}
                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Version {snippet.currentVersion + 1}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Code viewer + diff */}
            <div className="min-w-0 space-y-4">
              {compareFrom && compareTo ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-medium text-slate-300">
                      Diff v{compareFrom} ↔ v{compareTo}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setCompareFrom(null);
                        setCompareTo(null);
                      }}
                      className="text-xs text-slate-400 transition-colors hover:text-white"
                    >
                      Close diff
                    </button>
                  </div>
                  <RenderCompare
                    snippetId={id}
                    baseVersion={compareFrom}
                    compareVersion={compareTo}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>Compare any two versions:</span>
                    <select
                      value={compareFrom}
                      onChange={(e) => setCompareFrom(Number(e.target.value))}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="" disabled>From</option>
                      {versions.map((v) => (
                        <option key={`from-${v.versionNumber}`} value={v.versionNumber}>v{v.versionNumber}</option>
                      ))}
                    </select>
                    <select
                      value={compareTo}
                      onChange={(e) => setCompareTo(Number(e.target.value))}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="" disabled>To</option>
                      {versions.map((v) => (
                        <option key={`to-${v.versionNumber}`} value={v.versionNumber}>v{v.versionNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-medium text-slate-300">
                      {versionLoading ? 'Loading…' : `Code (v${selectedVersion || snippet.currentVersion})`}
                    </h2>
                    {versions.length > 1 && selectedVersion && (
                      <button
                        type="button"
                        onClick={() => {
                          // Default comparison: current selected version vs the latest version.
                          const latest = versions[versions.length - 1]?.versionNumber;
                          if (latest && latest !== selectedVersion) {
                            setCompareFrom(selectedVersion);
                            setCompareTo(latest);
                          } else {
                            // Fall back to the previous version if only one exists.
                            const prev = versions[versions.length - 2]?.versionNumber;
                            if (prev) {
                              setCompareFrom(prev);
                              setCompareTo(selectedVersion);
                            }
                          }
                        }}
                        className="text-xs text-blue-400 transition-colors hover:text-blue-300"
                      >
                        Compare versions
                      </button>
                    )}
                  </div>
                  {versionLoading || !codeLoaded ? (
                    <CodeEditorSkeleton />
                  ) : (
                    <div
                      className={`grid gap-3 ${
                        hasErrors ? 'lg:grid-cols-[1fr_220px]' : 'grid-cols-1'
                      }`}
                    >
                      <CodeEditor
                        value={currentCode}
                        language={snippet.language}
                        height="460px"
                        readOnly
                        errorLines={errorLines}
                      />
                      {hasErrors && (
                        <aside className="max-h-[460px] overflow-auto rounded-xl border border-red-900/50 bg-red-950/20 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
                              Errors in code
                            </h3>
                          </div>
                          <ul className="space-y-2 text-xs text-red-200">
                            {analysis.errors.map((errorItem, index) => {
                              const lineMatch = String(errorItem).match(/line\s*[:#]?\s*(\d+)/i);
                              const lineNo = lineMatch ? Number(lineMatch[1]) : null;
                              return (
                                <li
                                  key={`err-${index}`}
                                  className="rounded-md border border-red-900/40 bg-red-950/30 p-2"
                                >
                                  {lineNo && (
                                    <span className="mb-1 inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                                      Line {lineNo}
                                    </span>
                                  )}
                                  <p className="leading-snug">{errorItem}</p>
                                </li>
                              );
                            })}
                          </ul>
                          {errorLines.length === 0 && (
                            <p className="mt-2 text-[11px] text-red-400/70">
                              Tip: include “Line N” in error notes to highlight the exact line in the editor.
                            </p>
                          )}
                        </aside>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-medium text-slate-300">AI code analysis</h2>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analysisLoading || cooldownActive}
                    className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analysisLoading
                      ? 'Analyzing…'
                      : cooldownActive
                        ? `Wait ${cooldownLeft}s`
                        : analysis
                          ? 'Try Again'
                          : 'Explain Code'}
                  </button>
                </div>
                {analysisLoading ? (
                  <p className="text-sm text-slate-400">Analyzing your code for errors, suggestions, and complexity…</p>
                ) : cooldownActive ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm font-medium text-slate-300">🧠 AI Analysis</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Please wait {cooldownLeft}s before requesting another AI analysis.
                    </p>
                    {analysis && (
                      <p className="mt-1 text-xs text-slate-500">
                        Showing your previous analysis below meanwhile.
                      </p>
                    )}
                  </div>
                ) : analysis ? (
                  <>
                    {analysis.groqError && (
                      <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                        🧠 AI Analysis
                        <br />
                        ⚠ AI service is temporarily unavailable.
                        <br />
                        Showing cached/local analysis instead.
                      </p>
                    )}

                    {/* Category badge */}
                    {analysis.category && (
                      <div className="mb-3">
                        <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs text-blue-400">
                          {analysis.category}
                        </span>
                      </div>
                    )}

                    {/* Time & Space complexity — only for DSA problems */}
                    {analysis.isDSA && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Time complexity</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {analysis.timeComplexity || analysis.complexity?.timeComplexity || 'N/A'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Space complexity</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {analysis.spaceComplexity || analysis.complexity?.spaceComplexity || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-sm text-slate-300">{analysis.explanation}</p>

                    {/* Suggestions / Improvements */}
                    {analysis.suggestions?.length > 0 && (
                      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                          {analysis.isDSA ? 'Improvements' : 'Suggestions'}
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-300">
                          {analysis.suggestions.map((suggestion, index) => (
                            <li key={`${suggestion}-${index}`}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Future Requirements / Scalability */}
                    {analysis.futureSuggestions?.length > 0 && (
                      <div className="mt-3 rounded-lg border border-blue-900/50 bg-blue-950/20 p-3">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-blue-400">
                          Future Requirements & Scalability
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-blue-200">
                          {analysis.futureSuggestions.map((suggestion, index) => (
                            <li key={`future-${suggestion}-${index}`}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Optimized / Improved Code */}
                    {analysis.optimizedCode && (
                      <div className="mt-3">
                        <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-emerald-400">
                          {analysis.isDSA ? 'Optimized Code (Lower TC/SC)' : 'Improved Code'}
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                          <pre className="max-h-[300px] overflow-auto p-3 font-mono text-xs text-slate-200">
                            <code>{analysis.optimizedCode}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
                    <p className="font-medium text-slate-300">🧠 AI Analysis</p>
                    <p className="mt-2">No analysis has been generated for this version yet.</p>
                    <p className="mt-1 text-xs text-slate-500">Click “Explain Code” to generate one.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Version history sidebar */}
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

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-medium text-slate-300">Community feedback</h2>
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      liked ? 'bg-pink-500/15 text-pink-400' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {liked ? 'Liked' : 'Like'} · {likeCount}
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    rows={2}
                    placeholder="Share feedback or ask a question"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{comments.length} comments</span>
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={commentSubmitting}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                    >
                      {commentSubmitting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <article key={comment._id} className="rounded-md border border-slate-800 bg-slate-950 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            {comment.userId?.avatar && (
                              <img src={comment.userId.avatar} alt={comment.userId.name} className="h-4 w-4 rounded-full object-cover" />
                            )}
                            <span>{comment.userId?.name || 'Unknown'}</span>
                          </div>
                          {user?.id === comment.userId?._id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-[10px] text-red-400 transition-colors hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-200">{comment.text}</p>
                      </article>
                    ))
                  )}
                </div>

                {commentTotalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => loadComments(Math.max(1, commentPage - 1))}
                      disabled={commentPage === 1}
                      className="rounded-md border border-slate-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span>Page {commentPage} / {commentTotalPages}</span>
                    <button
                      type="button"
                      onClick={() => loadComments(Math.min(commentTotalPages, commentPage + 1))}
                      disabled={commentPage === commentTotalPages}
                      className="rounded-md border border-slate-700 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </main>
    </div>
  );
}

// Loads the two version codes and renders a DiffViewer.
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
      <DiffViewer oldCode={codes.baseCode} newCode={codes.comparedCode} />
    </AnimatePresence>
  );
}