import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { Decoration, EditorView } from '@codemirror/view';
import { RangeSet, StateEffect, StateField } from '@codemirror/state';
import CodeMirror from '@uiw/react-codemirror';
import { memo, useEffect, useMemo, useRef } from 'react';

// Map supported languages to CodeMirror language extensions.
const languageExtensions = {
  javascript: javascript(),
  js: javascript(),
  jsx: javascript(),
  typescript: javascript(),
  ts: javascript(),
  tsx: javascript(),
  python: python(),
  py: python(),
  json: json(),
  markdown: markdown(),
  md: markdown(),
  html: html(),
  css: css(),
  sql: sql(),
  c: cpp(),
  'c++': cpp(),
  cpp: cpp(),
  java: java(),
  dsa: python(),
};

// State effect + field used to mark error lines for highlighting.
const setErrorLines = StateEffect.define();

const errorLineField = StateField.define({
  create() {
    return RangeSet.empty;
  },
  update(value, tr) {
    value = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setErrorLines)) {
        const lines = effect.value || [];
        const decorations = [];
        lines.forEach((lineNumber) => {
          if (lineNumber > 0 && lineNumber <= tr.state.doc.lines) {
            const line = tr.state.doc.line(lineNumber);
            decorations.push(
              Decoration.line({ class: 'cm-error-line' }).range(line.from)
            );
          }
        });
        return RangeSet.of(decorations, true);
      }
    }
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const CodeEditor = memo(function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  height = '320px',
  readOnly = false,
  theme = 'dark',
  errorLines = [],
}) {
  const editorViewRef = useRef(null);

  const extensions = useMemo(() => {
    const lang = languageExtensions[language?.toLowerCase()] || javascript();
    const result = [lang, errorLineField];
    if (readOnly) result.push(EditorView.editable.of(false));
    return result;
  }, [language, readOnly]);

  // Re-dispatch error line decorations whenever the prop changes.
  useEffect(() => {
    if (!editorViewRef.current) return;
    editorViewRef.current.dispatch({
      effects: setErrorLines.of(errorLines || []),
    });
  }, [errorLines]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <CodeMirror
        value={value}
        height={height}
        theme={theme}
        editable={!readOnly}
        readOnly={readOnly}
        extensions={extensions}
        onChange={readOnly ? undefined : onChange}
        onCreateEditor={(view) => {
          editorViewRef.current = view;
          if (errorLines?.length > 0) {
            view.dispatch({ effects: setErrorLines.of(errorLines) });
          }
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
        }}
      />
    </div>
  );
});

export default CodeEditor;