import { motion } from 'framer-motion';
import { lazy, Suspense, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import api from '../services/api.js';
import { useAuth } from '../store/AuthContext.jsx';
import {
  DSA_LANGUAGES,
  SQL_LANGUAGES,
  DSA_TOPICS,
  SQL_TOPICS,
  DIFFICULTIES,
  SQL_DIALECTS,
  STARTER_BOILERPLATES,
  DEFAULT_MOCK_SQL_SCHEMA,
} from '../utils/languages.js';

const CodeEditor = lazy(() => import('../components/CodeEditor.jsx'));

export default function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDomain = searchParams.get('domain') === 'sql' ? 'sql' : 'dsa';

  const { token } = useAuth();
  const [domain, setDomain] = useState(initialDomain);
  const [code, setCode] = useState(STARTER_BOILERPLATES[initialDomain === 'sql' ? 'sql' : 'python']);
  const [sqlSchema, setSqlSchema] = useState(DEFAULT_MOCK_SQL_SCHEMA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      domain: initialDomain,
      language: initialDomain === 'sql' ? 'sql' : 'python',
      difficulty: 'Medium',
      topic: initialDomain === 'sql' ? 'Window Functions' : 'Two Pointers',
      tags: '',
      isPublic: true,
      commitMessage: 'Initial version',
      problemStatement: '',
      targetTimeComplexity: 'O(n)',
      targetSpaceComplexity: 'O(1)',
      sqlDialect: 'standard',
    },
  });

  const selectedLanguage = watch('language');

  const handleDomainSwitch = (newDomain) => {
    setDomain(newDomain);
    setValue('domain', newDomain);
    if (newDomain === 'sql') {
      setValue('language', 'sql');
      setValue('topic', 'Window Functions');
      setValue('targetTimeComplexity', 'O(n log n)');
      setValue('targetSpaceComplexity', 'O(n)');
      setCode(STARTER_BOILERPLATES.sql);
    } else {
      setValue('language', 'python');
      setValue('topic', 'Two Pointers');
      setValue('targetTimeComplexity', 'O(n)');
      setValue('targetSpaceComplexity', 'O(1)');
      setCode(STARTER_BOILERPLATES.python);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setValue('language', newLang);
    if (STARTER_BOILERPLATES[newLang] && (!code || code === STARTER_BOILERPLATES.python || code === STARTER_BOILERPLATES.java || code === STARTER_BOILERPLATES.cpp || code === STARTER_BOILERPLATES.javascript)) {
      setCode(STARTER_BOILERPLATES[newLang]);
    }
  };

  const insertBoilerplate = () => {
    if (domain === 'sql') {
      setCode(STARTER_BOILERPLATES.sql);
      setSqlSchema(DEFAULT_MOCK_SQL_SCHEMA);
    } else {
      setCode(STARTER_BOILERPLATES[selectedLanguage] || STARTER_BOILERPLATES.python);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');

    const normalizedToken = token?.trim();
    const normalizedCode = code.trim();

    if (!normalizedToken) {
      setError('Please sign in before publishing a problem or solution.');
      setSubmitting(false);
      return;
    }

    if (!normalizedCode) {
      setError('Code/Query is required before saving.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/snippets', {
        title: String(data.title || '').trim(),
        description: String(data.description || '').trim(),
        domain,
        difficulty: data.difficulty || 'Medium',
        topic: data.topic || 'General',
        language: domain === 'sql' ? 'sql' : String(data.language || 'python').trim().toLowerCase(),
        tags: String(data.tags || '')
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        code: normalizedCode,
        isPublic: data.isPublic === 'true' || data.isPublic === true,
        commitMessage: String(data.commitMessage || 'Initial version').trim(),
        problemStatement: String(data.problemStatement || '').trim(),
        targetTimeComplexity: domain === 'dsa' ? String(data.targetTimeComplexity || '').trim() : '',
        targetSpaceComplexity: domain === 'dsa' ? String(data.targetSpaceComplexity || '').trim() : '',
        sqlSchema: domain === 'sql' ? String(sqlSchema || '').trim() : '',
        sqlDialect: domain === 'sql' ? data.sqlDialect : 'standard',
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create problem entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Create New Problem / Solution</h1>
            <p className="mt-1 text-xs text-slate-400">
              Publish a DSA algorithmic problem or SQL query with version tracking & AI review.
            </p>
          </div>

          {/* Domain Toggle */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => handleDomainSwitch('dsa')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                domain === 'dsa' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🧠</span> DSA Problem
            </button>
            <button
              type="button"
              onClick={() => handleDomainSwitch('sql')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                domain === 'sql' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🗄️</span> SQL Query
            </button>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
            {/* Title & Difficulty */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label htmlFor="title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Problem Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="title"
                  {...register('title', {
                    required: 'Title is required',
                    maxLength: { value: 200, message: 'Title must be under 200 characters' },
                  })}
                  placeholder={domain === 'dsa' ? 'e.g. Trapping Rain Water' : 'e.g. Department Top Three Salaries'}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>}
              </div>

              <div>
                <label htmlFor="difficulty" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  {...register('difficulty')}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language & Topic / Pattern */}
            <div className="grid gap-4 md:grid-cols-2">
              {domain === 'dsa' ? (
                <div>
                  <label htmlFor="language" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Primary DSA Language
                  </label>
                  <select
                    id="language"
                    {...register('language')}
                    onChange={handleLanguageChange}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {DSA_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.icon} {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="sqlDialect" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    SQL Dialect
                  </label>
                  <select
                    id="sqlDialect"
                    {...register('sqlDialect')}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {SQL_DIALECTS.map((dial) => (
                      <option key={dial.id} value={dial.id}>
                        {dial.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="topic" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {domain === 'dsa' ? 'Algorithmic Pattern / Topic' : 'SQL Topic / Technique'}
                </label>
                <select
                  id="topic"
                  {...register('topic')}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {(domain === 'dsa' ? DSA_TOPICS : SQL_TOPICS).map((top) => (
                    <option key={top} value={top}>
                      {top}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Complexity (for DSA) */}
            {domain === 'dsa' && (
              <div className="grid gap-4 md:grid-cols-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div>
                  <label htmlFor="targetTimeComplexity" className="mb-1 block text-xs font-medium text-slate-300">
                    Target Time Complexity
                  </label>
                  <input
                    id="targetTimeComplexity"
                    {...register('targetTimeComplexity')}
                    placeholder="e.g. O(n), O(n log n), O(1)"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-blue-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="targetSpaceComplexity" className="mb-1 block text-xs font-medium text-slate-300">
                    Target Space Complexity
                  </label>
                  <input
                    id="targetSpaceComplexity"
                    {...register('targetSpaceComplexity')}
                    placeholder="e.g. O(1) auxiliary, O(n)"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-indigo-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Problem Statement / Constraints */}
            <div>
              <label htmlFor="problemStatement" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Problem Statement & Constraints
              </label>
              <textarea
                id="problemStatement"
                {...register('problemStatement')}
                rows={4}
                placeholder={
                  domain === 'dsa'
                    ? "Paste the problem description, example inputs/outputs, and numerical constraints (e.g. 1 <= nums.length <= 10^5)..."
                    : "Describe the SQL query objective, business requirement, or output column specifications..."
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Mock Schema Definition (for SQL) */}
            {domain === 'sql' && (
              <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Mock Table Schema (DDL & Sample Rows)
                  </label>
                  <button
                    type="button"
                    onClick={() => setSqlSchema(DEFAULT_MOCK_SQL_SCHEMA)}
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    Reset Default Schema
                  </button>
                </div>
                <textarea
                  value={sqlSchema}
                  onChange={(e) => setSqlSchema(e.target.value)}
                  rows={6}
                  placeholder="CREATE TABLE ... INSERT INTO ..."
                  className="w-full rounded-md border border-slate-700 bg-slate-900 p-2.5 font-mono text-xs text-emerald-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Tags & Visibility */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="tags" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  {...register('tags')}
                  placeholder="leetcode, amazon, dynamic-programming"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="visibility" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Visibility
                </label>
                <select
                  id="visibility"
                  {...register('isPublic')}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="true">Public (Visible to community)</option>
                  <option value="false">Private (Only me)</option>
                </select>
              </div>
            </div>

            {/* Version 1 Note */}
            <div>
              <label htmlFor="commitMessage" className="mb-1.5 block text-xs font-medium text-slate-300">
                Initial Version Note
              </label>
              <input
                id="commitMessage"
                {...register('commitMessage')}
                placeholder="e.g. Initial Brute Force O(n^2) approach"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Solution Code Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {domain === 'dsa' ? `Solution Code (${selectedLanguage})` : 'SQL Query Code'}
              </label>
              <button
                type="button"
                onClick={insertBoilerplate}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Insert Starter Template
              </button>
            </div>
            <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-sm text-slate-400">Loading editor…</div>}>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={domain === 'sql' ? 'sql' : selectedLanguage}
                height="380px"
              />
            </Suspense>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border border-slate-700 px-4 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-6 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Publishing…' : 'Publish Problem / Solution'}
            </motion.button>
          </div>
        </form>
      </main>
    </div>
  );
}
