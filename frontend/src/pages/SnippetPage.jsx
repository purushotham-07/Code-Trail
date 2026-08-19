import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor.jsx';
import DiffViewer from '../components/DiffViewer.jsx';
import { CodeEditorSkeleton } from '../components/LoadingSkeleton.jsx';
import Navbar from '../components/Navbar.jsx';
import VersionHistory from '../components/VersionHistory.jsx';
import DsaStudentToolkit from '../components/DsaStudentToolkit.jsx';
import api from '../services/api.js';
import { useAuth } from '../store/AuthContext.jsx';
import { useTheme } from '../store/ThemeContext.jsx';
import {
  SQL_LANGUAGES,
  DSA_TOPICS,
  SQL_TOPICS,
  DIFFICULTIES,
  SQL_DIALECTS,
  DEFAULT_MOCK_SQL_SCHEMA,
  DSA_PATTERN_GUIDE,
  STARTER_BOILERPLATES,
  TIME_COMPLEXITY_OPTIONS,
  SPACE_COMPLEXITY_OPTIONS,
  TOPIC_DEFAULT_TAGS,
  detectTopicAndTags,
  generateTopicHints,
} from '../utils/languages.js';
import { detectStaticSyntaxErrors } from '../utils/syntaxValidator.js';

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

const getDifficultyPill = (difficulty) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'Hard':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case 'Medium':
    default:
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  }
};

export default function SnippetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [snippet, setSnippet] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentCode, setCurrentCode] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [codeLoaded, setCodeLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [versionLoading, setVersionLoading] = useState(false);

  // LeetCode Left Panel active tab: 'description' | 'hints' | 'toolkit' | 'editorial' | 'versions' | 'solutions'
  const [leftTab, setLeftTab] = useState('description');

  // Save Version Modal / Form state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveCommitMessage, setSaveCommitMessage] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);

  // Edit Problem Details Modal (Title, Difficulty, Topic, Problem Statement, Tags)
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('Medium');
  const [editTopic, setEditTopic] = useState('General');
  const [editTags, setEditTags] = useState('');
  const [editLanguage, setEditLanguage] = useState('python');
  const [editProblemStatement, setEditProblemStatement] = useState('');
  const [editTargetTime, setEditTargetTime] = useState('');
  const [editTargetSpace, setEditTargetSpace] = useState('');
  const [editSqlSchema, setEditSqlSchema] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  // Delete Problem state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSnippet, setDeletingSnippet] = useState(false);

  // Error & Social state
  const [error, setError] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // AI Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownActive = cooldownLeft > 0;

  // Progressive Hint Ladder Unlocking
  const [revealedHints, setRevealedHints] = useState(new Set());

  // Solution Code on Demand
  const [showSolutionCode, setShowSolutionCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('optimized'); // 'optimized' | 'corrected'
  const [copiedCode, setCopiedCode] = useState(false);

  // Diff comparison modal / view
  const [showDiffView, setShowDiffView] = useState(false);
  const [compareFrom, setCompareFrom] = useState(1);
  const [compareTo, setCompareTo] = useState(1);

  // Live countdown for AI cooldown
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

  const localSyntaxIssues = useMemo(() => {
    return detectStaticSyntaxErrors(currentCode, snippet?.language || 'python');
  }, [currentCode, snippet?.language]);

  const allSyntaxIssues = useMemo(() => {
    const combined = new Map();
    localSyntaxIssues.forEach((iss) => {
      combined.set(`${iss.line}-${iss.title}`, iss);
    });
    if (Array.isArray(analysis?.issues)) {
      analysis.issues.forEach((iss) => {
        combined.set(`${iss.line}-${iss.title}`, iss);
      });
    }
    return Array.from(combined.values());
  }, [localSyntaxIssues, analysis?.issues]);

  const errorLines = useMemo(() => {
    const lineNumbers = new Set();
    allSyntaxIssues.forEach((iss) => {
      const num = Number(iss?.line);
      if (Number.isFinite(num) && num > 0) lineNumbers.add(num);
    });
    return Array.from(lineNumbers).sort((a, b) => a - b);
  }, [allSyntaxIssues]);

  const hasErrors = allSyntaxIssues.length > 0;

  const effectiveHints = useMemo(() => {
    if (Array.isArray(analysis?.hints) && analysis.hints.length > 0) {
      return analysis.hints;
    }
    return generateTopicHints(snippet?.topic, snippet?.domain);
  }, [analysis?.hints, snippet?.topic, snippet?.domain]);

  const toggleHintReveal = (index) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const loadSnippet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/snippets/${id}`);
      setSnippet(res.data.snippet);
      setEditTitle(res.data.snippet.title || '');
      setEditDifficulty(res.data.snippet.difficulty || 'Medium');
      setEditTopic(res.data.snippet.topic || 'General');
      setEditTags((res.data.snippet.tags || []).join(', '));
      setEditLanguage(res.data.snippet.language || 'python');
      setEditProblemStatement(res.data.snippet.problemStatement || res.data.snippet.description || '');
      setEditTargetTime(res.data.snippet.targetTimeComplexity || 'O(n)');
      setEditTargetSpace(res.data.snippet.targetSpaceComplexity || 'O(1)');
      setEditSqlSchema(res.data.snippet.sqlSchema || DEFAULT_MOCK_SQL_SCHEMA);
    } catch (_err) {
      setError('Problem not found or failed to load.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadVersions = useCallback(async () => {
    try {
      const res = await api.get(`/versions/${id}/history`);
      const vList = res.data.versions || [];
      setVersions(vList);
      if (vList.length > 0) {
        const latest = vList[vList.length - 1];
        setSelectedVersion(latest.versionNumber);
        if (vList.length >= 2) {
          setCompareFrom(vList[vList.length - 2].versionNumber);
          setCompareTo(latest.versionNumber);
        } else {
          setCompareFrom(1);
          setCompareTo(1);
        }
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

  const loadComments = useCallback(async () => {
    try {
      const res = await api.get(`/comments/${id}`, {
        params: { page: 1, limit: 50 },
      });
      setComments(res.data.comments || []);
    } catch (_error) {
      // Ignore
    }
  }, [id]);

  useEffect(() => {
    loadSnippet();
    loadVersions();
    loadLikeStatus();
    loadComments();
  }, [loadSnippet, loadVersions, loadLikeStatus, loadComments]);

  // Load code for active selected version
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
        setRevealedHints(new Set());
        setShowSolutionCode(false);
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

  // Handle Save New Version (in ONE unified API call)
  const handleSaveVersion = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      setError('Please sign in to save your solution.');
      return;
    }
    if (!isOwner) {
      setError('You are viewing a community problem. Click "Fork" to save your personal version history.');
      return;
    }
    if (savingVersion) return; // Prevent duplicate rapid submission

    setSavingVersion(true);
    setError('');

    const nextVer = (snippet?.currentVersion || 1) + 1;
    const note = saveCommitMessage.trim() || `Iteration v${nextVer}`;

    try {
      const res = await api.put(`/snippets/${id}`, {
        title: snippet.title,
        description: snippet.description,
        domain: snippet.domain,
        difficulty: snippet.difficulty,
        topic: snippet.topic,
        language: snippet.language,
        tags: snippet.tags,
        isPublic: snippet.isPublic,
        code: currentCode,
        commitMessage: note,
        problemStatement: snippet.problemStatement,
        targetTimeComplexity: snippet.targetTimeComplexity,
        targetSpaceComplexity: snippet.targetSpaceComplexity,
        sqlSchema: snippet.sqlSchema,
        sqlDialect: snippet.sqlDialect,
      });

      setShowSaveModal(false);
      setSaveCommitMessage('');
      // In 1 single API call: snippet and all updated versions are refreshed!
      if (res.data.snippet) setSnippet(res.data.snippet);
      if (res.data.versions) setVersions(res.data.versions);
      setSelectedVersion(nextVer);
      setLeftTab('versions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save version.');
    } finally {
      setSavingVersion(false);
    }
  };

  // Handle Edit Problem Details (in ONE unified API call)
  const handleSaveProblemDetails = async (e) => {
    if (e) e.preventDefault();
    if (!isOwner || savingDetails) return;

    setSavingDetails(true);
    try {
      const res = await api.put(`/snippets/${id}`, {
        title: editTitle.trim(),
        difficulty: editDifficulty,
        topic: editTopic.trim(),
        tags: editTags
          ? editTags
              .split(',')
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean)
          : undefined,
        language: editLanguage.trim().toLowerCase(),
        problemStatement: editProblemStatement.trim(),
        targetTimeComplexity: editTargetTime.trim(),
        targetSpaceComplexity: editTargetSpace.trim(),
        sqlSchema: editSqlSchema.trim(),
        code: currentCode,
        commitMessage: `Updated problem parameters`,
      });
      setShowEditDetailsModal(false);
      if (res.data.snippet) setSnippet(res.data.snippet);
      if (res.data.versions) setVersions(res.data.versions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update problem details.');
    } finally {
      setSavingDetails(false);
    }
  };

  // Handle Delete Entire Problem / Snippet
  const handleDeleteSnippet = async () => {
    if (!isOwner || deletingSnippet) return;
    setDeletingSnippet(true);
    setError('');
    try {
      await api.delete(`/snippets/${id}`);
      setShowDeleteModal(false);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete problem.');
    } finally {
      setDeletingSnippet(false);
    }
  };

  // Handle AI Code Review & Diagnostics
  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) {
      setError('Please sign in to run AI analysis.');
      return;
    }
    if (!currentCode.trim()) return;
    if (cooldownActive || analysisLoading) return;

    try {
      setAnalysisLoading(true);
      setError('');
      const res = await api.post('/analysis/analyze', {
        code: currentCode,
        language: snippet?.language || 'python',
        snippetId: id,
        versionNumber: selectedVersion || snippet?.currentVersion || 1,
        topic: snippet?.topic || 'General',
        problemStatement: snippet?.problemStatement || snippet?.description || '',
        targetTimeComplexity: snippet?.targetTimeComplexity || '',
        targetSpaceComplexity: snippet?.targetSpaceComplexity || '',
        sqlSchema: snippet?.sqlSchema || '',
        sqlDialect: snippet?.sqlDialect || 'standard',
        forceRefresh: true,
      });
      setAnalysis(res.data);
      setRevealedHints(new Set());
      setShowSolutionCode(false);
      setLeftTab('editorial'); // Switch to Review tab automatically!
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'AI review failed. Please try again.';
      if (status === 429) {
        const match = message.match(/(\d+)\s*s/);
        setCooldownLeft(match ? Number(match[1]) : 4);
        setError('Please wait a few seconds before requesting AI review again.');
      } else {
        setError(message);
      }
    } finally {
      setAnalysisLoading(false);
    }
  }, [canAnalyze, currentCode, snippet, id, selectedVersion, cooldownActive, analysisLoading]);

  const handleToggleLike = async () => {
    if (!user) {
      setError('Please sign in to like this problem.');
      return;
    }
    try {
      const res = await api.post(`/likes/${id}`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch (_error) {
      // Ignore
    }
  };

  const handleFork = async () => {
    if (!user) {
      setError('Please sign in to fork this problem.');
      return;
    }
    try {
      const res = await api.post(`/snippets/${id}/fork`);
      navigate(`/snippet/${res.data.snippet._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fork problem.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !user || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const res = await api.post(`/comments/${id}`, { content: commentInput.trim() });
      setComments((prev) => [res.data.comment, ...prev]);
      setCommentInput('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (_err) {
      // Ignore
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const patternGuide = DSA_PATTERN_GUIDE[snippet?.topic];

  if (loading && !snippet) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <CodeEditorSkeleton />
        </div>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Problem Not Found</h2>
          <p className="mt-2 text-sm text-slate-500">This problem may have been removed or made private.</p>
          <Link to="/" className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
            Back to Problem List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="hover:underline font-bold">
            ✕
          </button>
        </div>
      )}

      {/* TOP LEETCODE-STYLE SUBHEADER BAR */}
      <header className="border-b border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#262626] px-4 py-2.5 transition-colors">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 max-w-7xl">
          {/* Left: Problem Title, Badges & Domain */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Problem List
            </Link>

            <span className="text-slate-300 dark:text-[#404040]">|</span>

            <span
              className={`rounded px-2 py-0.5 text-[11px] font-bold border ${
                isSql
                  ? 'bg-emerald-50 dark:bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30'
              }`}
            >
              {isSql ? 'SQL' : 'DSA'}
            </span>

            <h1 className="text-sm font-bold text-slate-900 dark:text-white">{snippet.title}</h1>

            {snippet.difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${getDifficultyPill(snippet.difficulty)}`}>
                {snippet.difficulty}
              </span>
            )}

            {((isSql ? (!hasErrors && !analysis?.hasSyntaxErrors) : (analysis?.isSolved || (analysis?.targetComplexityMet && !analysis?.hasSyntaxErrors))) && !hasErrors && (analysis || staticSyntaxIssues.length === 0)) && (
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                <span>✓</span>
                <span>Solved</span>
              </span>
            )}

            {snippet.topic && snippet.topic !== 'General' && (
              <span className="rounded bg-slate-100 dark:bg-[#333333] px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#404040]">
                {snippet.topic}
              </span>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => setShowEditDetailsModal(true)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Edit Details
              </button>
            )}
          </div>

          {/* Right: Actions, Version Picker, Diff & Like */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Version Picker Pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a1a1a] rounded-lg p-0.5 border border-slate-200 dark:border-[#3a3a3a] text-xs">
              <span className="px-2 text-[11px] text-slate-500 font-mono">v{selectedVersion || snippet.currentVersion}</span>
              {versions.length > 1 && (
                <select
                  value={selectedVersion || snippet.currentVersion}
                  onChange={(e) => setSelectedVersion(Number(e.target.value))}
                  className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none pr-1 cursor-pointer font-mono"
                >
                  {versions.map((v) => (
                    <option key={`top-ver-${v.versionNumber}`} value={v.versionNumber} className="bg-white dark:bg-[#262626]">
                      v{v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Compare Diff Toggle */}
            <button
              type="button"
              onClick={() => setShowDiffView((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors border ${
                showDiffView
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#262626] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#3a3a3a] hover:bg-slate-100 dark:hover:bg-[#333333]'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
              <span>{showDiffView ? 'Hide Diff' : 'Compare Diff'}</span>
            </button>

            {/* Like */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${
                liked
                  ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#262626] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333333]'
              }`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>

            {/* Fork */}
            <button
              type="button"
              onClick={handleFork}
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#262626] px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333333]"
            >
              Fork
            </button>

            {/* Delete Problem (Owner only) */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                title="Delete this problem permanently"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete</span>
              </button>
            )}

            {/* Save New Version Button */}
            {isOwner ? (
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
              >
                <span>+</span>
                <span>Save Version</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* VERSION DIFF MODAL / DRAWER (When Compare Diff is active) */}
      <AnimatePresence>
        {showDiffView && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-200 dark:border-[#333333] bg-slate-100 dark:bg-[#161616] p-4 transition-colors"
          >
            <div className="mx-auto max-w-7xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Compare Base:</span>
                  <select
                    value={compareFrom}
                    onChange={(e) => setCompareFrom(Number(e.target.value))}
                    className="rounded border border-slate-300 dark:border-[#404040] bg-white dark:bg-[#262626] px-2.5 py-1 text-xs text-slate-900 dark:text-slate-200"
                  >
                    {versions.map((v) => (
                      <option key={`diff-from-${v.versionNumber}`} value={v.versionNumber}>
                        Version {v.versionNumber} ({v.commitMessage || 'Snapshot'})
                      </option>
                    ))}
                  </select>

                  <span className="text-slate-400 font-bold">↔</span>

                  <span className="font-semibold text-slate-700 dark:text-slate-300">Target:</span>
                  <select
                    value={compareTo}
                    onChange={(e) => setCompareTo(Number(e.target.value))}
                    className="rounded border border-slate-300 dark:border-[#404040] bg-white dark:bg-[#262626] px-2.5 py-1 text-xs text-slate-900 dark:text-slate-200"
                  >
                    {versions.map((v) => (
                      <option key={`diff-to-${v.versionNumber}`} value={v.versionNumber}>
                        Version {v.versionNumber} ({v.commitMessage || 'Snapshot'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDiffView(false)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Close Diff
                </button>
              </div>

              {/* Dynamic Diff Viewer */}
              <DiffViewer
                snippetId={id}
                baseVersion={compareFrom}
                compareVersion={compareTo}
                oldTitle={`v${compareFrom}`}
                newTitle={`v${compareTo}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LEETCODE 2-COLUMN SPLIT WORKSPACE */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 py-3 grid gap-3 lg:grid-cols-2">
        {/* LEFT COLUMN: Problem Description, Hints, Toolkit, Editorial, Versions & Solutions */}
        <section className="flex flex-col rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#262626] shadow-sm overflow-hidden min-h-[580px]">
          {/* LeetCode Tab Header */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#202020] px-3 pt-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setLeftTab('description')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                leftTab === 'description'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#262626] rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Description</span>
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('hints')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                leftTab === 'hints'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#262626] rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Hints</span>
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-1.5 text-[10px] text-blue-700 dark:text-blue-300">
                {effectiveHints.length}
              </span>
            </button>

            {!isSql && (
              <button
                type="button"
                onClick={() => setLeftTab('toolkit')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  leftTab === 'toolkit'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#262626] rounded-t-md'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Student Toolkit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLeftTab('editorial')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                leftTab === 'editorial'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#262626] rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Editorial & Review</span>
              {hasErrors ? (
                <span className="rounded-full bg-rose-100 dark:bg-rose-900/60 px-1.5 text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  {allSyntaxIssues.length} {allSyntaxIssues.length === 1 ? 'Error' : 'Errors'}
                </span>
              ) : analysis ? (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  {analysis.isSolved || analysis.targetComplexityMet ? 'Optimal' : 'Reviewed'}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('versions')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                leftTab === 'versions'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#262626] rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Submissions ({versions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('solutions')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                leftTab === 'solutions'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#262626] rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Solutions ({comments.length})</span>
            </button>
          </div>

          {/* Left Panel Tab Content */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[700px] space-y-4">
            {/* TAB 1: DESCRIPTION */}
            {leftTab === 'description' && (
              <div className="space-y-4 text-xs">
                {/* Title & Target Complexity */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{snippet.title}</h2>
                  {(snippet.targetTimeComplexity || snippet.targetSpaceComplexity) && !isSql && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono">
                      <span className="text-slate-500 font-sans">Target Complexity:</span>
                      {snippet.targetTimeComplexity && (
                        <span className="rounded bg-blue-50 dark:bg-[#1a1a1a] px-2 py-0.5 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-[#3a3a3a] font-semibold">
                          Time: {snippet.targetTimeComplexity}
                        </span>
                      )}
                      {snippet.targetSpaceComplexity && (
                        <span className="rounded bg-indigo-50 dark:bg-[#1a1a1a] px-2 py-0.5 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-[#3a3a3a] font-semibold">
                          Space: {snippet.targetSpaceComplexity}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Problem Statement Body */}
                <div className="rounded-lg bg-slate-50 dark:bg-[#1e1e1e] p-4 border border-slate-200 dark:border-[#333333] leading-relaxed font-sans text-slate-800 dark:text-slate-200 space-y-3">
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {snippet.problemStatement || snippet.description || 'No problem statement provided.'}
                  </div>
                </div>

                {/* SQL Schema Definition (for SQL snippets) */}
                {isSql && snippet.sqlSchema && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Database Tables & Schema
                    </h3>
                    <pre className="overflow-x-auto rounded bg-slate-50 dark:bg-[#1e1e1e] p-3 font-mono text-[11.5px] text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-[#333333] leading-relaxed">
                      <code>{snippet.sqlSchema}</code>
                    </pre>
                  </div>
                )}

                {/* Pattern Blueprint */}
                {patternGuide && !isSql && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400">
                      Algorithmic Pattern: {snippet.topic}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-snug">{patternGuide.invariant}</p>
                    <p className="font-mono text-emerald-700 dark:text-emerald-400 text-[11px]">Benchmark: {patternGuide.timeSpace}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PROGRESSIVE HINTS */}
            {leftTab === 'hints' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Progressive Hint Ladder</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Unlock hints one step at a time without spoiling the complete solution.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {effectiveHints.map((hint, i) => {
                    const isRevealed = revealedHints.has(i);
                    return (
                      <div
                        key={`hint-${i}`}
                        className="rounded-lg border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1e1e1e] p-3.5 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Hint {i + 1} {isSql
                              ? (i === 0 ? '(Query Strategy & Clauses)' : i === 1 ? '(Table Joins & Schema Nuance)' : '(Edge Cases & NULL Handling)')
                              : (i === 0 ? '(Intuition)' : i === 1 ? '(Data Structure)' : '(Algorithm & Edge Cases)')
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleHintReveal(i)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                          >
                            {isRevealed ? 'Hide Hint' : 'Reveal Hint'}
                          </button>
                        </div>
                        {isRevealed && (
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200 dark:border-[#333333]">
                            {hint}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: STUDENT TOOLKIT */}
            {leftTab === 'toolkit' && !isSql && (
              <div>
                <DsaStudentToolkit />
              </div>
            )}

            {/* TAB 4: EDITORIAL & AI REVIEW */}
            {leftTab === 'editorial' && (
              <div className="space-y-4 text-xs">
                {analysis ? (
                  <>
                    {/* Status Alert Banner */}
                    {isSql ? (
                      !hasErrors ? (
                        <div className="rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                              ✓
                            </div>
                            <div>
                              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">Query Validated • Solved</h4>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                SQL query syntax and structure validated successfully without syntax errors.
                              </p>
                            </div>
                          </div>
                          <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                            Valid
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-xs">
                              !
                            </div>
                            <div>
                              <h4 className="font-bold text-rose-800 dark:text-rose-300 text-xs">Syntax Errors Detected</h4>
                              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                                Please fix the SQL syntax errors highlighted below to complete the solution.
                              </p>
                            </div>
                          </div>
                          <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                            Error
                          </span>
                        </div>
                      )
                    ) : (analysis.isSolved || (analysis.targetComplexityMet && !analysis.hasSyntaxErrors)) && !hasErrors ? (
                      <div className="rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                            ✓
                          </div>
                          <div>
                            <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">Target Complexity Achieved • Solved</h4>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                              Achieved {analysis.timeComplexity || 'Optimal Time'} ({analysis.spaceComplexity || 'Optimal Space'}). Meets the target complexity benchmarks!
                            </p>
                          </div>
                        </div>
                        <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                          Optimal
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
                            !
                          </div>
                          <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-xs">Sub-Optimal Complexity</h4>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                              Achieved {analysis.timeComplexity || 'N/A'}. Target is {snippet.targetTimeComplexity || 'Optimal'}. Check the Hints tab for optimization clues!
                            </p>
                          </div>
                        </div>
                        <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                          Optimize
                        </span>
                      </div>
                    )}

                    {/* Current Version Complexity Card (DSA Only) */}
                    {!isSql && (
                      <div className="rounded-lg border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1e1e1e] p-4 space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                          Current Version Complexity
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#262626] p-3 space-y-1">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">Time Complexity</span>
                            <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                              {analysis.timeComplexity || 'O(n)'}
                            </p>
                            <p className="text-[10px] text-slate-400">Target: {snippet.targetTimeComplexity || 'Optimal'}</p>
                          </div>
                          <div className="rounded border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#262626] p-3 space-y-1">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">Space Complexity</span>
                            <p className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {analysis.spaceComplexity || 'O(1)'}
                            </p>
                            <p className="text-[10px] text-slate-400">Target: {snippet.targetSpaceComplexity || 'Optimal'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Syntax & Compilation Status */}
                    <div className="rounded-lg border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1e1e1e] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                          Syntax & Compilation Check
                        </h4>
                        {hasErrors ? (
                          <span className="rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold">
                            {allSyntaxIssues.length} {allSyntaxIssues.length === 1 ? 'Error' : 'Errors'} Detected
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                            ✓ Clean (No Syntax Errors)
                          </span>
                        )}
                      </div>

                      {allSyntaxIssues.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {allSyntaxIssues.map((iss, i) => (
                            <div
                              key={`iss-${i}`}
                              className="rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 p-3 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-rose-800 dark:text-rose-200">{iss.title}</span>
                                {iss.line && <span className="font-mono text-[10px] text-rose-600">Line {iss.line}</span>}
                              </div>
                              {iss.description && <p className="text-slate-600 dark:text-slate-400 leading-snug">{iss.description}</p>}
                              {iss.fix && (
                                <p className="rounded bg-white dark:bg-[#1a1a1a] p-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-[#333333]">
                                  Fix: {iss.fix}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Approach Analysis (Current vs Recommended) */}
                    <div className="rounded-lg border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1e1e1e] p-4 space-y-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                          Approach You Followed
                        </h4>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                          {analysis.currentApproach || (isSql ? 'Evaluated your SQL query clauses and structure.' : 'Evaluated your current algorithm implementation and state transitions.')}
                        </p>
                      </div>

                      <div className="border-t border-slate-200 dark:border-[#333333] pt-3">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px]">
                          {isSql ? 'Optimal Query Strategy & Best Practice' : 'Approach You Should Follow (To Reach Target Complexity)'}
                        </h4>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                          {analysis.recommendedApproach || (isSql ? `Follow optimal ${snippet.topic} pattern.` : `Apply optimal ${snippet.topic} pattern to achieve ${snippet.targetTimeComplexity || 'optimal'} time and ${snippet.targetSpaceComplexity || 'optimal'} space.`)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1e1e1e] p-8 text-center text-xs text-slate-500">
                    <p>{isSql ? 'Click "Explain & Review" in the editor toolbar to inspect SQL syntax and query strategy.' : 'Click "Explain & Review" in the editor toolbar to inspect time/space complexity, syntax check, and approach comparison.'}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SUBMISSIONS & VERSIONS */}
            {leftTab === 'versions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Version History & Submissions</h3>
                  <span className="text-xs text-slate-500">{versions.length} total versions</span>
                </div>

                <VersionHistory
                  versions={versions}
                  currentVersion={snippet.currentVersion}
                  selectedVersion={selectedVersion}
                  onSelect={(ver) => setSelectedVersion(ver)}
                />
              </div>
            )}

            {/* TAB 6: SOLUTIONS & DISCUSSION */}
            {leftTab === 'solutions' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Community Discussion & Approaches</h3>

                {user ? (
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      rows={2}
                      placeholder="Share an optimization tip, edge case, or approach…"
                      className="w-full rounded-lg border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1e1e1e] p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={commentSubmitting || !commentInput.trim()}
                        className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        {commentSubmitting ? 'Posting…' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-slate-500">Sign in to join the discussion.</p>
                )}

                <div className="space-y-3 divide-y divide-slate-100 dark:divide-[#333333] pt-2">
                  {comments.map((c) => (
                    <div key={c._id} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <div className="flex items-center gap-2">
                          {c.author?.avatar && (
                            <img src={c.author.avatar} alt={c.author.name} className="h-5 w-5 rounded-full object-cover" />
                          )}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.author?.name || 'User'}</span>
                        </div>
                        <span className="text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-7">{c.content}</p>
                      {user && user.id === c.author?._id && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c._id)}
                            className="text-[10px] text-rose-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Code Editor, Language Selector & Action Toolbar */}
        <section className="flex flex-col rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#262626] shadow-sm overflow-hidden min-h-[580px]">
          {/* Editor Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#202020] px-3 py-2">
            {/* Primary Language */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isSql ? 'SQL Dialect:' : 'Language:'}
              </span>
              <span className="rounded bg-slate-200 dark:bg-[#333333] px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                {snippet.language}
              </span>
            </div>

            {/* Quick Actions (Template, Copy) */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const boilerplate = isSql ? STARTER_BOILERPLATES.sql : STARTER_BOILERPLATES[snippet.language] || STARTER_BOILERPLATES.python;
                  setCurrentCode(boilerplate);
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title="Reset Starter Template"
              >
                Template
              </button>

              <button
                type="button"
                onClick={() => handleCopyCode(currentCode)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title="Copy Editor Code"
              >
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Main Code Editor */}
          <div className="flex-1 min-h-[460px] bg-white dark:bg-[#1e1e1e]">
            {versionLoading || !codeLoaded ? (
              <CodeEditorSkeleton />
            ) : (
              <CodeEditor
                value={currentCode}
                onChange={setCurrentCode}
                language={snippet.language}
                height="500px"
                errorLines={errorLines}
              />
            )}
          </div>

          {/* LeetCode Bottom Console / Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#202020] px-4 py-2.5">
            {/* Left: Active Version State */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Selected: v{selectedVersion || snippet.currentVersion}</span>
              {currentCode !== versions.find((v) => v.versionNumber === selectedVersion)?.fullCode && (
                <span className="text-amber-500 font-sans font-semibold">● Unsaved edits</span>
              )}
            </div>

            {/* Right: Explain & Review + Save Version */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analysisLoading || cooldownActive}
                className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-600/15 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/25 disabled:opacity-50 transition-colors shadow-sm"
              >
                {analysisLoading
                  ? 'Analyzing…'
                  : cooldownActive
                  ? `Wait (${cooldownLeft}s)`
                  : 'Explain & Review'}
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  Save Version {snippet.currentVersion + 1}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* SAVE VERSION MODAL (With double-click prevention) */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] p-5 shadow-2xl space-y-4 text-xs text-slate-800 dark:text-slate-200"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Save Version {snippet.currentVersion + 1}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Record an incremental solution iteration with a commit note.
                </p>
              </div>

              <form onSubmit={handleSaveVersion} className="space-y-3">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                    Version Note / Commit Message <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={saveCommitMessage}
                    onChange={(e) => setSaveCommitMessage(e.target.value)}
                    placeholder={`e.g. Optimize inner loop from O(N^2) to O(N)`}
                    className="w-full rounded-lg border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    disabled={savingVersion}
                    className="rounded-lg border border-slate-200 dark:border-[#404040] px-3.5 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-[#333333]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingVersion || !saveCommitMessage.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {savingVersion ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <span>Save Version {snippet.currentVersion + 1}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT DETAILS MODAL */}
      <AnimatePresence>
        {showEditDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] p-5 shadow-2xl space-y-4 text-xs text-slate-800 dark:text-slate-200"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Problem Parameters</h3>
                <p className="text-[11px] text-slate-500">Update problem statement, difficulty, and complexity targets.</p>
              </div>

              <form onSubmit={handleSaveProblemDetails} className="space-y-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditTitle(newTitle);
                      const combined = `${newTitle} ${editProblemStatement}`;
                      const { topic: detectedTopic, tags: detectedTags } = detectTopicAndTags(combined, snippet.domain);
                      if (detectedTopic) {
                        setEditTopic(detectedTopic);
                        if (detectedTags?.length > 0) setEditTags(detectedTags.join(', '));
                      }
                    }}
                    className="w-full rounded border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Difficulty</label>
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value)}
                      className="w-full rounded border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Topic / Pattern</label>
                    <select
                      value={editTopic}
                      onChange={(e) => {
                        const newTopic = e.target.value;
                        setEditTopic(newTopic);
                        const defaultTags = TOPIC_DEFAULT_TAGS[newTopic] || [];
                        if (defaultTags.length > 0) {
                          setEditTags(defaultTags.join(', '));
                        }
                      }}
                      className="w-full rounded border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {(isSql ? SQL_TOPICS : DSA_TOPICS).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. two-pointers, array, sorted-array"
                    className="w-full rounded border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                {!isSql && (
                  <div className="grid gap-3 grid-cols-2">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Target Time Complexity</label>
                      <select
                        value={editTargetTime || 'O(n)'}
                        onChange={(e) => setEditTargetTime(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs font-mono text-blue-700 dark:text-blue-300"
                      >
                        {TIME_COMPLEXITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Target Space Complexity</label>
                      <select
                        value={editTargetSpace || 'O(1)'}
                        onChange={(e) => setEditTargetSpace(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] px-3 py-1.5 text-xs font-mono text-indigo-700 dark:text-indigo-300"
                      >
                        {SPACE_COMPLEXITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Problem Description</label>
                  <textarea
                    rows={4}
                    value={editProblemStatement}
                    onChange={(e) => {
                      const newDesc = e.target.value;
                      setEditProblemStatement(newDesc);
                      const combined = `${editTitle} ${newDesc}`;
                      const { topic: detectedTopic, tags: detectedTags } = detectTopicAndTags(combined, snippet.domain);
                      if (detectedTopic) {
                        setEditTopic(detectedTopic);
                        if (detectedTags?.length > 0) setEditTags(detectedTags.join(', '));
                      }
                    }}
                    placeholder="Enter problem description, constraints, and examples..."
                    className="w-full rounded border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1a1a1a] p-2.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#333333]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditDetailsModal(false);
                      setShowDeleteModal(true);
                    }}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                  >
                    Delete Problem
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditDetailsModal(false)}
                      className="rounded border border-slate-200 dark:border-[#404040] px-3 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-[#333333]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingDetails}
                      className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {savingDetails ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE PROBLEM CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#262626] p-5 shadow-2xl space-y-4 text-xs text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Problem</h3>
                  <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">"{snippet.title}"</span>? All {versions.length} version histories, community comments, and reviews will be permanently removed.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#333333]">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingSnippet}
                  className="rounded-lg border border-slate-200 dark:border-[#404040] px-3.5 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-[#333333]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSnippet}
                  disabled={deletingSnippet}
                  className="rounded-lg bg-rose-600 px-4 py-1.5 font-semibold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {deletingSnippet ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <span>Delete Permanently</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
