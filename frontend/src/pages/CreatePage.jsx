import { motion } from 'framer-motion';
import { lazy, Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import api from '../services/api.js';
import { useAuth } from '../store/AuthContext.jsx';

const CodeEditor = lazy(() => import('../components/CodeEditor.jsx'));

const LANGUAGES = ['javascript', 'java', 'python', 'sql', 'dsa', 'c', 'c++', 'cpp', 'json', 'markdown', 'html', 'css', 'typescript'];

export default function CreatePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      language: 'javascript',
      tags: '',
      isPublic: true,
      commitMessage: '',
      codingPlatformMode: false,
      problemStatement: '',
    },
  });

  const language = watch('language');
  const codingPlatformMode = watch('codingPlatformMode');

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');

    const normalizedToken = token?.trim();
    const normalizedCode = code.trim();

    if (!normalizedToken) {
      setError('Please sign in before saving a snippet.');
      setSubmitting(false);
      return;
    }

    if (!normalizedCode) {
      setError('Code is required before saving the snippet.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/snippets', {
        title: String(data.title || '').trim(),
        description: String(data.description || '').trim(),
        language: String(data.language || 'javascript').trim().toLowerCase(),
        tags: String(data.tags || '')
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        code: normalizedCode,
        isPublic: data.isPublic === 'true' || data.isPublic === true,
        commitMessage: String(data.commitMessage || '').trim(),
        problemStatement: data.codingPlatformMode
          ? String(data.problemStatement || '').trim()
          : '',
      });
      navigate('/profile');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to create snippet"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Create Snippet</h1>
          <p className="mt-1 text-sm text-slate-400">Share a reusable snippet with the community.</p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
                <input
                  id="title"
                  {...register('title', { required: 'Title is required', maxLength: { value: 200, message: 'Title must be under 200 characters' } })}
                  placeholder="e.g. Debounce function"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
              </div>
              <div>
                <label htmlFor="language" className="mb-1.5 block text-sm font-medium text-slate-300">Language</label>
                <select
                  id="language"
                  {...register('language')}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                placeholder="What does this snippet do?"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="tags" className="mb-1.5 block text-sm font-medium text-slate-300">Tags (comma separated)</label>
                <input
                  id="tags"
                  {...register('tags')}
                  placeholder="react, hooks, utils"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="visibility" className="mb-1.5 block text-sm font-medium text-slate-300">Visibility</label>
                <select
                  id="visibility"
                  {...register('isPublic')}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </div>
            </div>

            {/* Coding Platform Mode toggle */}
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <label htmlFor="codingPlatformMode" className="block text-sm font-medium text-slate-300">
                    Coding Platform Mode
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Enable to get hint-based feedback on your DSA approach from the AI mentor.
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors">
                  <input
                    id="codingPlatformMode"
                    type="checkbox"
                    {...register('codingPlatformMode')}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block h-6 w-11 rounded-full transition-colors ${
                      codingPlatformMode ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        codingPlatformMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </label>
              </div>

              {/* Problem statement textarea — shown only when toggle is on */}
              {codingPlatformMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="problemStatement" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Problem Statement / Question
                  </label>
                  <textarea
                    id="problemStatement"
                    {...register('problemStatement')}
                    rows={6}
                    placeholder="Paste the coding problem here (e.g. from LeetCode, Codeforces, HackerRank)..."
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </motion.div>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="commitMessage" className="mb-1.5 block text-sm font-medium text-slate-300">
                Version name <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="commitMessage"
                {...register('commitMessage', { maxLength: { value: 200, message: 'Version name must be under 200 characters' } })}
                placeholder="e.g. Initial version"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              {errors.commitMessage && <p className="mt-1 text-xs text-red-400">{errors.commitMessage.message}</p>}
              <p className="mt-1 text-xs text-slate-400">Leave blank to use the default name “Initial version”.</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Code</label>
            <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-sm text-slate-400">Loading editor…</div>}>
              <CodeEditor value={code} onChange={setCode} language={language} height="360px" />
            </Suspense>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Snippet'}
            </motion.button>
          </div>
        </form>
      </main>
    </div>
  );
}
