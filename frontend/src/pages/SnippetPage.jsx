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
import {
  DSA_LANGUAGES,
  SQL_LANGUAGES,
  DSA_TOPICS,
  SQL_TOPICS,
  DIFFICULTIES,
  SQL_DIALECTS,
  DEFAULT_MOCK_SQL_SCHEMA,
} from '../utils/languages.js';

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

const getDifficultyClass = (difficulty) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Hard':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'Medium':
    default:
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }
};

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
  const [editDomain, setEditDomain] = useState('dsa');
  const [editDifficulty, setEditDifficulty] = useState('Medium');
  const [editTopic, setEditTopic] = useState('General');
  const [editLanguage, setEditLanguage] = useState('python');
  const [editTags, setEditTags] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editCode, setEditCode] = useState('');
  const [editCommitMessage, setEditCommitMessage] = useState('');
  const [editProblemStatement, setEditProblemStatement] = useState('');
  const [editTargetTime, setEditTargetTime] = useState('');
  const [editTargetSpace, setEditTargetSpace] = useState('');
  const [editSqlSchema, setEditSqlSchema] = useState('');
  const [editSqlDialect, setEditSqlDialect] = useState('standard');

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

  // Polyglot Rosetta State (for DSA)
  const [activePolyglotLang, setActivePolyglotLang] = useState('python');
  const [polyglotTranslations, setPolyglotTranslations] = useState({});
  const [translatingPolyglot, setTranslatingPolyglot] = useState(false);

  // SQL Schema & Pipeline State (for SQL)
  const [activeViewTab, setActiveViewTab] = useState('code'); // 'code' | 'schema' | 'rosetta'
  const [activeSqlStep, setActiveSqlStep] = useState(0);

  // Active generated code tab inside AI review
  const [activeCodeTab, setActiveCodeTab] = useState('corrected'); // 'corrected' | 'optimized'
  const [copiedCode, setCopiedCode] = useState(false);
  const [showProblemStatement, setShowProblemStatement] = useState(true);

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
  const isSql = useMemo(() => snippet?.domain === 'sql' || snippet?.language === 'sql', [snippet]);

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
      const s = res.data.snippet;
      setSnippet(s);
      if (s.polyglotSolutions) {
        setPolyglotTranslations(s.polyglotSolutions);
      }
      setActivePolyglotLang(s.language === 'sql' ? 'python' : s.language || 'python');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load problem');
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
      setVersions([]);
    }
  }, [id]);

  const loadLikeStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/likes/${id}/status`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount || 0);
    } catch (_error) {
      // Ignore
    }
  }, [id, user]);

  const loadComments = useCallback(
    async (targetPage = 1) => {
      try {
        const res = await api.get(`/comments/${id}`, {
          params: { page: targetPage, limit: 10 },
        });
        setComments(res.data.comments || []);
        setCommentPage(res.data.pagination?.page || 1);
        setCommentTotalPages(res.data.pagination?.totalPages || 1);
      } catch (_error) {
        // Ignore
      }
    },
    [id]
  );

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
    setEditDomain(snippet.domain || (snippet.language === 'sql' ? 'sql' : 'dsa'));
    setEditDifficulty(snippet.difficulty || 'Medium');
    setEditTopic(snippet.topic || 'General');
    setEditLanguage(snippet.language || 'python');
    setEditTags(Array.isArray(snippet.tags) ? snippet.tags.join(', ') : '');
    setEditIsPublic(snippet.isPublic !== false);
    setEditProblemStatement(snippet.problemStatement || '');
    setEditTargetTime(snippet.targetTimeComplexity || '');
    setEditTargetSpace(snippet.targetSpaceComplexity || '');
    setEditSqlSchema(snippet.sqlSchema || DEFAULT_MOCK_SQL_SCHEMA);
    setEditSqlDialect(snippet.sqlDialect || 'standard');
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
        domain: editDomain,
        difficulty: editDifficulty,
        topic: editTopic.trim(),
        language: editLanguage.trim().toLowerCase(),
        tags: editTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        isPublic: editIsPublic,
        code: editCode,
        commitMessage: editCommitMessage.trim(),
        problemStatement: editProblemStatement.trim(),
        targetTimeComplexity: editTargetTime.trim(),
        targetSpaceComplexity: editTargetSpace.trim(),
        sqlSchema: editSqlSchema.trim(),
        sqlDialect: editSqlDialect,
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
      setError('Please sign in to run AI analysis.');
      return;
    }
    if (!currentCode.trim()) return;
    if (cooldownActive) return;

    try {
      setAnalysisLoading(true);
      const res = await api.post('/analysis/analyze', {
        code: currentCode,
        language: snippet?.language || 'python',
        snippetId: id,
        versionNumber: selectedVersion || snippet?.currentVersion || 1,
        domain: snippet?.domain || (snippet?.language === 'sql' ? 'sql' : 'dsa'),
        problemStatement: snippet?.problemStatement || '',
        targetTimeComplexity: snippet?.targetTimeComplexity || '',
        targetSpaceComplexity: snippet?.targetSpaceComplexity || '',
        sqlSchema: snippet?.sqlSchema || '',
        sqlDialect: snippet?.sqlDialect || 'standard',
        forceRefresh: true,
      });
      setAnalysis(res.data);
      if (res.data.polyglotTranslations) {
        setPolyglotTranslations((prev) => ({ ...prev, ...res.data.polyglotTranslations }));
      }
      if (res.data.correctedCode) {
        setActiveCodeTab('corrected');
      } else if (res.data.optimizedCode) {
        setActiveCodeTab('optimized');
      }
      setError('');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'AI analysis failed. Please try again.';
      if (status === 429) {
        const match = message.match(/(\d+)\s*seconds/);
        setCooldownLeft(match ? Number(match[1]) : 6);
        setError('Please wait a few seconds before requesting AI analysis again.');
      } else {
        setError(message);
      }
    } finally {
      setAnalysisLoading(false);
    }
  }, [canAnalyze, currentCode, snippet, id, selectedVersion, cooldownActive]);

  const handleTranslatePolyglot = async (targetLang) => {
    if (!currentCode.trim()) return;
    try {
      setTranslatingPolyglot(true);
      const res = await api.post('/analysis/translate', {
        code: currentCode,
        fromLanguage: snippet?.language || 'python',
        toLanguage: targetLang,
      });
      if (res.data.translatedCode) {
        setPolyglotTranslations((prev) => ({
          ...prev,
          [targetLang]: res.data.translatedCode,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Translation failed.');
    } finally {
      setTranslatingPolyglot(false);
    }
  };

  const handleCopyCode = (codeText) => {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleLike = async () => {
    if (!user) {
      setError('Please sign in to like this problem');
      return;
    }
    try {
      const res = await api.post(`/likes/${id}`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle like');
    }
  };

  const handleFork = async () => {
    if (!user) {
      setError('Please sign in to fork this problem');
      return;
    }
    try {
      const res = await api.post(`/snippets/${id}/fork`);
      navigate(`/snippet/${res.data.snippet._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fork problem');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to comment');
      return;
    }
    if (!commentInput.trim()) return;
    setCommentSubmitting(true);
    try {
      await api.post(`/comments/${id}`, { content: commentInput.trim() });
      setCommentInput('');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <CodeEditorSkeleton />
        </main>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-12 text-center">
          <p className="text-base text-slate-400">Problem not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* HEADER: Title, Badges, Author & Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-bold border ${
                    isSql
                      ? 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-blue-600/15 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {isSql ? '🗄️ SQL Studio' : '🧠 DSA Arena'}
                </span>

                {snippet.difficulty && (
                  <span className={`rounded px-2.5 py-0.5 text-xs font-bold border ${getDifficultyClass(snippet.difficulty)}`}>
                    {snippet.difficulty}
                  </span>
                )}

                {snippet.topic && (
                  <span className="rounded bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300 border border-slate-700">
                    {snippet.topic}
                  </span>
                )}

                <span className="rounded bg-slate-900 px-2.5 py-0.5 font-mono text-xs text-slate-400 border border-slate-800">
                  {snippet.language?.toUpperCase()}
                </span>
              </div>

              <h1 className="text-2xl font-black text-white">{snippet.title}</h1>
              {snippet.description && <p className="text-xs text-slate-400">{snippet.description}</p>}
            </div>

            {/* Actions: Like, Fork, Edit */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  liked
                    ? 'border-rose-500/40 bg-rose-500/15 text-rose-400'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{liked ? '❤️' : '🤍'}</span>
                <span>{likeCount}</span>
              </button>

              <button
                type="button"
                onClick={handleFork}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                <span>🔀</span>
                <span>Fork</span>
              </button>

              {isOwner && !editing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  <span>✏️</span>
                  <span>Edit / Version {snippet.currentVersion + 1}</span>
                </button>
              )}
            </div>
          </div>

          {/* Complexity Target & Evolution Banner */}
          {(snippet.targetTimeComplexity || snippet.targetSpaceComplexity || versions.length > 1) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs">
              {/* Target & Achieved Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-slate-400">
                  <span className="text-slate-500">Target:</span>
                  {snippet.targetTimeComplexity && (
                    <span className="rounded bg-slate-950 px-2 py-0.5 text-blue-300 border border-slate-800 font-bold">
                      ⏱ {snippet.targetTimeComplexity}
                    </span>
                  )}
                  {snippet.targetSpaceComplexity && (
                    <span className="rounded bg-slate-950 px-2 py-0.5 text-indigo-300 border border-slate-800 font-bold">
                      💾 {snippet.targetSpaceComplexity}
                    </span>
                  )}
                </div>

                {analysis && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-slate-500">Achieved:</span>
                    <span className="rounded bg-slate-950 px-2 py-0.5 text-emerald-300 border border-slate-800 font-bold">
                      ⏱ {analysis.timeComplexity || analysis.complexity?.timeComplexity || 'Evaluated'}
                    </span>
                    <span className="rounded bg-slate-950 px-2 py-0.5 text-emerald-300 border border-slate-800 font-bold">
                      💾 {analysis.spaceComplexity || analysis.complexity?.spaceComplexity || 'Evaluated'}
                    </span>
                    {analysis.targetComplexityMet && (
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                        ✓ Target Met
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Algorithmic Evolution Timeline Trail */}
              {versions.length > 1 && (
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <span className="text-slate-500">Evolution:</span>
                  {versions.slice(-4).map((v, i, arr) => (
                    <span key={v.versionNumber} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedVersion(v.versionNumber)}
                        className={`rounded px-1.5 py-0.5 ${
                          selectedVersion === v.versionNumber
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        v{v.versionNumber}
                      </button>
                      {i < arr.length - 1 && <span className="text-slate-600">➔</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Problem Statement Card (Collapsible) */}
        {!editing && snippet.problemStatement && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 text-blue-400 font-bold">
                  📝
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Problem Description & Constraints
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowProblemStatement((prev) => !prev)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showProblemStatement ? 'Hide Description' : 'Show Description'}
              </button>
            </div>
            {showProblemStatement && (
              <p className="mt-3 whitespace-pre-wrap font-mono text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800">
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
            className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl mb-6"
          >
            <h2 className="text-lg font-bold text-white">
              Edit Problem & Publish Version {snippet.currentVersion + 1}
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-300">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-300">Difficulty</label>
                <select
                  value={editDifficulty}
                  onChange={(e) => setEditDifficulty(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-300">Topic / Pattern</label>
                <select
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {(editDomain === 'sql' ? SQL_TOPICS : DSA_TOPICS).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-300">Language</label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {(editDomain === 'sql' ? SQL_LANGUAGES : DSA_LANGUAGES).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-300">Problem Statement</label>
              <textarea
                value={editProblemStatement}
                onChange={(e) => setEditProblemStatement(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-300">Solution Code</label>
              <CodeEditor value={editCode} onChange={setEditCode} language={editLanguage} height="360px" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-300">
                Commit Message / Version Note <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={editCommitMessage}
                onChange={(e) => setEditCommitMessage(e.target.value)}
                placeholder="e.g. Optimized inner loop to use HashMap O(n) (required)"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editCommitMessage.trim()}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Save Version {snippet.currentVersion + 1}
              </button>
            </div>
          </motion.div>
        ) : null}

        {/* WORKSPACE & VIEW TABS */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* LEFT: Code / Diff / Polyglot / Schema Workspace */}
          <div className="space-y-6">
            {/* View Mode Toggle Bar (Code vs 4-Lang Polyglot Rosetta vs Mock Schema) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('code')}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                    activeViewTab === 'code' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Code (v{selectedVersion || snippet.currentVersion})
                </button>

                {!isSql && (
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('rosetta')}
                    className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition-colors ${
                      activeViewTab === 'rosetta'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-indigo-300'
                    }`}
                  >
                    <span>🌐</span> 4-Language Polyglot Rosetta
                  </button>
                )}

                {isSql && snippet.sqlSchema && (
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('schema')}
                    className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition-colors ${
                      activeViewTab === 'schema'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    <span>🗄️</span> Mock Schema Tables
                  </button>
                )}
              </div>

              {/* Compare Diff Button */}
              {versions.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const prev = versions[versions.length - 2]?.versionNumber || 1;
                    const latest = versions[versions.length - 1]?.versionNumber || 2;
                    setCompareFrom(prev);
                    setCompareTo(latest);
                  }}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  <span>⇄</span>
                  <span>Compare Diff</span>
                </button>
              )}
            </div>

            {/* VIEW 1: VS Code Version Diff View */}
            {compareFrom && compareTo ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-300">Comparing:</span>
                    <select
                      value={compareFrom}
                      onChange={(e) => setCompareFrom(Number(e.target.value))}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                    >
                      {versions.map((v) => (
                        <option key={`from-${v.versionNumber}`} value={v.versionNumber}>
                          v{v.versionNumber}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-500">↔</span>
                    <select
                      value={compareTo}
                      onChange={(e) => setCompareTo(Number(e.target.value))}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                    >
                      {versions.map((v) => (
                        <option key={`to-${v.versionNumber}`} value={v.versionNumber}>
                          v{v.versionNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareFrom(null);
                      setCompareTo(null);
                    }}
                    className="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    Close Diff
                  </button>
                </div>

                <DiffViewer snippetId={id} baseVersion={compareFrom} compareVersion={compareTo} />
              </div>
            ) : activeViewTab === 'rosetta' && !isSql ? (
              /* VIEW 2: 4-Language Polyglot Rosetta View (Java, Python, C++, JS) */
              <div className="rounded-xl border border-indigo-900/50 bg-slate-900 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 font-bold">
                      🌐
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">4-Language Polyglot Rosetta</h3>
                      <p className="text-[11px] text-slate-400">
                        Compare this algorithm side-by-side across Java, Python, C++, and JavaScript.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTranslatePolyglot(activePolyglotLang)}
                    disabled={translatingPolyglot}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <span>⚡</span>
                    <span>{translatingPolyglot ? 'Translating…' : `Translate to ${activePolyglotLang}`}</span>
                  </button>
                </div>

                {/* 4 Language Tabs */}
                <div className="flex flex-wrap gap-2">
                  {DSA_LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActivePolyglotLang(l.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                        activePolyglotLang === l.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{l.icon}</span>
                      <span>{l.label}</span>
                      {polyglotTranslations[l.id] || (snippet.language === l.id) ? (
                        <span className="rounded-full bg-emerald-500/20 px-1 text-[9px] text-emerald-400">✓</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                {/* Polyglot Code View */}
                <div>
                  <CodeEditor
                    value={
                      activePolyglotLang === snippet.language
                        ? currentCode
                        : polyglotTranslations[activePolyglotLang] ||
                          `// Click "Translate to ${activePolyglotLang}" above to generate idiomatic ${activePolyglotLang} solution.`
                    }
                    language={activePolyglotLang}
                    height="420px"
                    readOnly
                  />
                </div>
              </div>
            ) : activeViewTab === 'schema' && isSql ? (
              /* VIEW 3: SQL Mock Schema Viewer */
              <div className="rounded-xl border border-emerald-900/50 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 font-bold">
                      🗄️
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Database Schema & Mock Records</h3>
                      <p className="text-[11px] text-slate-400">Underlying tables and columns used in this query.</p>
                    </div>
                  </div>
                </div>
                <CodeEditor value={snippet.sqlSchema || DEFAULT_MOCK_SQL_SCHEMA} language="sql" height="380px" readOnly />
              </div>
            ) : (
              /* VIEW 4: Standard Code Editor View */
              <div className="space-y-3">
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

            {/* AI CODE REVIEW & ALGORITHMIC COACH SECTION */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 text-base">
                    🧠
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {isSql ? 'SQL Query Execution & Performance Auditor' : 'AI Algorithmic Coach & Big-O Review'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isSql
                        ? 'Clause execution pipeline, index suggestions, and query anti-patterns'
                        : 'Big-O complexity, 3-tier hint ladder, scoring, and bug fixes'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analysisLoading || cooldownActive}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                  {analysisLoading
                    ? 'Analyzing…'
                    : cooldownActive
                    ? `Wait (${cooldownLeft}s)`
                    : analysis
                    ? 'Re-analyze'
                    : 'Explain & Audit Code'}
                </button>
              </div>

              {/* Analysis Results Display */}
              {analysis && (
                <div className="space-y-4 pt-1">
                  {/* Syntax & Issues Alert Card */}
                  {analysis.hasSyntaxErrors || (analysis.issues?.length > 0) ? (
                    <div className="rounded-lg border border-rose-500/50 bg-rose-950/25 p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-rose-500/20 text-rose-400 font-bold">
                          ⚠️
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-rose-300">
                            {analysis.hasSyntaxErrors ? 'Syntax / Compiler Errors Detected' : 'Code Issues Detected'}
                          </h3>
                          <p className="text-xs text-rose-200/80">
                            {analysis.issues?.length || 1} issue(s) detected in {snippet.language}.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        {(analysis.issues || []).map((iss, i) => (
                          <div
                            key={`review-iss-${i}`}
                            className="rounded-md border border-rose-900/60 bg-rose-950/40 p-3 space-y-1.5 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
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
                                <span className="font-semibold text-rose-200">{iss.title}</span>
                              </div>
                              {iss.line && (
                                <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                                  Line {iss.line}
                                </span>
                              )}
                            </div>
                            {iss.description && <p className="text-slate-300 leading-relaxed">{iss.description}</p>}
                            {iss.fix && (
                              <p className="rounded bg-slate-950/80 p-2 font-mono text-[11px] text-emerald-300 border border-slate-800">
                                💡 Fix: {iss.fix}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
                      <span>✅</span>
                      <span>
                        <strong>Syntax Valid:</strong> Clean code with no compilation or parse errors.
                      </span>
                    </div>
                  )}

                  {/* Score & Complexity Card */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-lg font-black text-blue-400">
                          {analysis.overallScore}
                          <span className="text-[10px] font-normal text-slate-400">/10</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Algorithmic Quality Score</h3>
                          <p className="text-xs text-slate-400">
                            {analysis.category} {analysis.subCategory ? `· ${analysis.subCategory}` : ''}
                          </p>
                        </div>
                      </div>

                      {(analysis.timeComplexity || analysis.complexity?.timeComplexity) && (
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="rounded bg-slate-800 px-2.5 py-1 text-blue-300 border border-slate-700">
                            ⏱ Time: {analysis.timeComplexity || analysis.complexity?.timeComplexity}
                          </span>
                          <span className="rounded bg-slate-800 px-2.5 py-1 text-indigo-300 border border-slate-700">
                            💾 Space: {analysis.spaceComplexity || analysis.complexity?.spaceComplexity}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bars */}
                    {analysis.ratings && (
                      <div className="grid gap-2 sm:grid-cols-5">
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

                    {analysis.summary && <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-2.5">{analysis.summary}</p>}
                  </div>

                  {/* SQL Execution Order Pipeline (if SQL) */}
                  {isSql && analysis.sqlAnalysis?.clauseOrder?.length > 0 && (
                    <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/15 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🔄</span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Logical SQL Execution Pipeline
                        </h3>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {analysis.sqlAnalysis.clauseOrder.map((step, idx) => (
                          <div
                            key={`step-${idx}`}
                            className="rounded-md border border-emerald-900/50 bg-slate-950 p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="rounded bg-emerald-600/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                Step {step.order || idx + 1}
                              </span>
                              <span className="font-bold text-white">{step.clause}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{step.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3-Tier Progressive Hints (for interview prep) */}
                  {analysis.hints?.length > 0 && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        🎯 3-Tier Progressive Hint Ladder
                      </h3>
                      <div className="space-y-2">
                        {analysis.hints.map((hint, i) => (
                          <div
                            key={`hint-${i}`}
                            className="flex items-start gap-2.5 rounded-md border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs text-slate-300"
                          >
                            <span className="shrink-0 rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                              Hint {i + 1}
                            </span>
                            <span className="leading-relaxed">{hint}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Code Generation Tabs (Corrected vs Optimized) */}
                  {(analysis.correctedCode || analysis.optimizedCode) && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-2">
                        <div className="flex gap-2">
                          {analysis.correctedCode && (
                            <button
                              type="button"
                              onClick={() => setActiveCodeTab('corrected')}
                              className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                                activeCodeTab === 'corrected'
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Bug-Free Corrected Code
                            </button>
                          )}
                          {analysis.optimizedCode && (
                            <button
                              type="button"
                              onClick={() => setActiveCodeTab('optimized')}
                              className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                                activeCodeTab === 'optimized'
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Optimized Solution
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCode(
                              activeCodeTab === 'optimized' ? analysis.optimizedCode : analysis.correctedCode
                            )
                          }
                          className="rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          {copiedCode ? '✓ Copied' : 'Copy Solution'}
                        </button>
                      </div>

                      <div className="p-2">
                        <CodeEditor
                          value={activeCodeTab === 'optimized' ? analysis.optimizedCode : analysis.correctedCode}
                          language={snippet.language}
                          height="260px"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* COMMENTS SECTION */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white">Community Discussion & Insights ({comments.length})</h2>

              {user ? (
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    rows={2}
                    placeholder="Share an edge case, alternative approach, or optimization tip…"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={commentSubmitting || !commentInput.trim()}
                      className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {commentSubmitting ? 'Posting…' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate-400">Sign in to join the discussion.</p>
              )}

              <div className="space-y-3 divide-y divide-slate-800/80 pt-2">
                {comments.map((c) => (
                  <div key={c._id} className="pt-3 first:pt-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-2">
                        {c.author?.avatar && (
                          <img src={c.author.avatar} alt={c.author.name} className="h-5 w-5 rounded-full object-cover" />
                        )}
                        <span className="font-semibold text-slate-200">{c.author?.name || 'User'}</span>
                      </div>
                      <span className="text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-7">{c.content}</p>
                    {user && user.id === c.author?._id && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Version History Drawer & Metadata */}
          <div className="space-y-6">
            {/* Version History Drawer */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Version History ({versions.length})
                </h3>
              </div>

              <VersionHistory
                versions={versions}
                currentVersion={snippet.currentVersion}
                selectedVersion={selectedVersion}
                onSelectVersion={setSelectedVersion}
                snippetId={id}
                isOwner={isOwner}
                onVersionRestored={() => {
                  loadSnippet();
                  loadVersions();
                }}
              />
            </div>

            {/* Author & Problem Details Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Author & Metadata</h3>
              <div className="flex items-center gap-3">
                {snippet.owner?.avatar && (
                  <img
                    src={snippet.owner.avatar}
                    alt={snippet.owner.name}
                    className="h-9 w-9 rounded-full object-cover border border-slate-700"
                  />
                )}
                <div>
                  <p className="font-semibold text-white">{snippet.owner?.name || 'Developer'}</p>
                  <p className="text-[11px] text-slate-400">Created on {new Date(snippet.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Domain:</span>
                  <span className="font-semibold text-slate-200">{isSql ? 'SQL' : 'DSA'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Difficulty:</span>
                  <span className="font-semibold text-slate-200">{snippet.difficulty || 'Medium'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pattern / Topic:</span>
                  <span className="font-semibold text-slate-200">{snippet.topic || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Visibility:</span>
                  <span className="font-semibold text-slate-200">{snippet.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Versions:</span>
                  <span className="font-semibold text-slate-200">{snippet.currentVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
