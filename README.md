# CodeTrail — DSA & SQL Problem-Solving & Version-Controlled Platform

CodeTrail is an advanced, version-controlled **DSA & SQL Problem-Solving and Practice Platform** built with the MERN stack (MongoDB, Express, React, Node.js) and a Vite-powered frontend. It supports 4 first-class DSA languages (**Java**, **Python**, **C++**, **JavaScript**) and **SQL** (PostgreSQL, MySQL, SQLite, Standard SQL), with time-travel algorithmic evolution tracking, 4-language Polyglot Rosetta conversion, SQL clause execution visualizers, and a 3-tier progressive AI hint ladder.

## 🚀 Key Features

### 🧠 DSA Arena (Java · Python · C++ · JavaScript)
- **4 Core Languages** — Specialized syntax highlighting and compiler diagnostics for Java 17+, Python 3, C++20, and modern JavaScript.
- **🌐 4-Language Polyglot Rosetta View** — Compare and translate solutions across Java, Python, C++, and JavaScript in 1 click with AI-driven idiomatic conversions.
- **🎯 Complexity Target vs Achieved Auditor** — Set target Time & Space complexity ($O(N)$, $O(1)$) and verify with automated AI diagnostics.
- **📈 Algorithmic Evolution Timeline** — Visual version trail tracking how solutions evolve across versions (e.g. $v1$ $O(N^2)$ Brute Force $\rightarrow$ $v2$ $O(N)$ Hash Map $\rightarrow$ $v3$ $O(1)$ Space Two Pointers).
- **💡 3-Tier AI Hint Ladder** — Tier 1 (Intuition), Tier 2 (Data Structure & Invariant), Tier 3 (Algorithm Transitions & Edge Cases) for real interview coaching without spoiling the code.
- **Pattern Taxonomy** — Filter problems by 15 DSA patterns (*Two Pointers, Sliding Window, Monotonic Stack, DP, Graphs, Trees, Binary Search, Heaps, etc.*).

### 🗄️ SQL Studio (PostgreSQL · MySQL · SQLite · Standard SQL)
- **Dialect-Specific Support** — Write and audit queries tailored for PostgreSQL, MySQL, SQLite, and Standard SQL.
- **🔄 Logical SQL Execution Pipeline Visualizer** — Step-by-step breakdown of how SQL executes clauses (`FROM/JOIN` $\rightarrow$ `WHERE` $\rightarrow$ `GROUP BY` $\rightarrow$ `HAVING` $\rightarrow$ `SELECT` $\rightarrow$ `ORDER BY` $\rightarrow$ `LIMIT`).
- **🗃️ Mock Schema & Table Builder** — Define table schemas (DDL) and mock rows.
- **🔍 Query Anti-Pattern & Index Optimizer** — Detects table scans, Cartesian joins, unindexed columns, and suggests indexes.
- **Topic Taxonomy** — Filter by SQL techniques (*Window Functions, CTEs & Recursion, Multi-Table Joins, Aggregations, Subqueries, Ranking*).

### ⚡ Core Architecture
- **VS Code-Style Diff Viewer** — Side-by-Side and Unified LCS line diffs with 22px fixed density, hatch patterns on empty rows, and diff copy tools.
- **Time-Travel Snapshots** — Reconstruct any version sequentially using snapshot optimization ($v1$ and every 20th version).
- **Google OAuth 2.0 & JWT Auth** — Secure profile management and session authentication.
- **Social Features** — Like, fork, tag, comment, and public/private problem visibility.

---

## 🛠 Tech Stack

### Frontend
- React 18 (Vite)
- React Router 6
- Tailwind CSS 3
- Framer Motion 11
- CodeMirror 6 with `@codemirror/lang-cpp`, `@codemirror/lang-java`, `@codemirror/lang-python`, `@codemirror/lang-javascript`, and `@codemirror/lang-sql`
- Axios & React Hook Form

### Backend
- Node.js & Express.js (ES Modules)
- MongoDB & Mongoose
- Google Auth Library & JSON Web Tokens
- Groq AI Engine (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound`)
- Helmet, CORS, Rate Limiting & Mongo-Sanitize

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on `mongodb://127.0.0.1:27017/codetrail` or MongoDB Atlas URI)
- Groq API Key (for live AI code analysis & Polyglot conversions)

### Setup Backend
```bash
cd backend
npm install
# Create .env based on .env.example
npm run dev
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Author:** Purushotham Reddy