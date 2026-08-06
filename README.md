# CodeTrail

CodeTrail is a production-ready, version-controlled code snippet sharing platform built with the MERN stack (MongoDB, Express, React, Node.js) and a Vite-powered frontend. It supports Google sign-in, JWT-protected routes, snippet versioning, a custom LCS-based diff viewer, version reconstruction with snapshot optimization, forking, search, and a polished minimal UI inspired by GitHub, VS Code, and Linear.

## Features

- **Google Sign-In Only** — OAuth 2.0 login with JWT session exchange and profile image storage.
- **Protected Routes** — Server-side JWT middleware and client-side route guards.
- **Snippet CRUD** — Create, edit, delete, search, list, and fork snippets.
- **Version History** — Every save creates a new version with a commit message, author, and timestamp.
- **Custom Diff Viewer** — LCS (Longest Common Subsequence) line-by-line diff implemented in `utils/diff.js` (no external diff libraries). Added lines are green, deleted lines red, unchanged lines gray.
- **Version Reconstruction** — `utils/reconstructVersion.js` reconstructs any requested version by leveraging the nearest snapshot and replaying stored diffs sequentially.
- **Snapshot Optimization** — Full snapshots stored for version 1 and every 20th version; all other versions store compact diffs.
- **Fork Workflow** — Fork any public snippet as a new version 1 owned by the current user, preserving fork information.
- **Search** — Search by title, language, and tags using MongoDB text indexes.
- **User Profile** — Avatar, name, total snippets, total forks, and public snippet counts.
- **Responsive UI** — Clean, minimal dark design with Framer Motion animations (60 FPS) and Tailwind CSS.
- **Performance** — Lazy loading, code splitting, `React.memo`, debounced search, and pagination.
- **Coding Platform Mode** — Paste a problem statement to get hint-based DSA approach feedback from the AI mentor.

## Tech Stack

### Frontend

- React 18 (Vite)
- React Router 6
- Tailwind CSS 3
- Framer Motion 11
- Axios
- React Hook Form
- CodeMirror 6 (`@uiw/react-codemirror`)

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- Google OAuth 2.0 (`google-auth-library`)
- JWT (`jsonwebtoken`)
- Helmet, CORS, express-rate-limit
- Groq AI (LLM-powered code analysis)

## Folder Structure

```
CodeTrail/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── analysisController.js
│   │   ├── commentController.js
│   │   ├── likeController.js
│   │   ├── searchController.js
│   │   ├── snippetController.js
│   │   ├── userController.js
│   │   └── versionController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Analysis.js
│   │   ├── Comment.js
│   │   ├── Like.js
│   │   ├── Snippet.js
│   │   ├── User.js
│   │   └── Version.js
│   ├── routes/
│   │   ├── analysisRoutes.js
│   │   ├── authRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── likeRoutes.js
│   │   ├── searchRoutes.js
│   │   ├── snippetRoutes.js
│   │   ├── userRoutes.js
│   │   └── versionRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   └── versionService.js
│   ├── utils/
│   │   ├── diff.js
│   │   ├── jwt.js
│   │   └── reconstructVersion.js
│   ├── eslint.config.js
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CodeEditor.jsx
    │   │   ├── DiffViewer.jsx
    │   │   ├── GoogleLoginButton.jsx
    │   │   ├── LoadingSkeleton.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Pagination.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── SnippetCard.jsx
    │   │   └── VersionHistory.jsx
    │   ├── hooks/
    │   │   └── useDebouncedValue.js
    │   ├── pages/
    │   │   ├── CreatePage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── SnippetPage.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── store/
    │   │   └── AuthContext.jsx
    │   ├── utils/
    │   │   ├── complexity.js
    │   │   ├── diff.js
    │   │   └── reconstructVersion.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── styles.css
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/codetrail.git
cd codetrail
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```bash
PORT=5000
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGO_URI=mongodb://127.0.0.1:27017/codetrail
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-session-secret
GROQ_API_KEY=your-groq-api-key
```

Create a `.env` file in the `frontend/` directory:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. Run the application

```bash
# Backend (port 5000)
cd backend
npm run dev

# Frontend (port 5173) — in a separate terminal
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Deployment

### Frontend — Vercel (Free Tier)

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `frontend/`.
5. Add the following **Environment Variables**:
   - `VITE_API_URL` — set to your Render backend URL (e.g. `https://codetrail-api.onrender.com/api`)
   - `VITE_GOOGLE_CLIENT_ID` — your Google OAuth client ID
6. Click **Deploy**. Vercel will auto-detect Vite and build the project.

### Backend — Render (Free Tier)

1. Push the repository to GitHub.
2. Go to [render.com](https://render.com) and click **New → Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `codetrail-api`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGO_URI`: Your MongoDB connection string (use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
   - `JWT_SECRET`: A secure random string
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://codetrail.vercel.app`)
   - `SESSION_SECRET`: A secure random string
   - `GROQ_API_KEY`: Your Groq API key (optional, for AI code analysis)
6. Click **Create Web Service**.

### After Deployment

1. Update your **Google Cloud Console** OAuth redirect URIs to include both:
   - `http://localhost:5173` (local dev)
   - `https://codetrail.vercel.app` (production frontend)
2. Update the **Authorized JavaScript origins** to include:
   - `http://localhost:5173`
   - `https://codetrail.vercel.app`

## API Endpoints

### Auth

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/google` | Google OAuth login (expects `{ credential }`) |
| GET | `/api/auth/me` | Get current user (protected) |
| POST | `/api/auth/logout` | Logout (protected) |

### Snippets

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/snippets/public?page=1&limit=12` | Get all public snippets (paginated) |
| GET | `/api/snippets/user?page=1&limit=12` | Get current user's snippets (protected) |
| GET | `/api/snippets/:id` | Get a single snippet (public ones accessible anonymously) |
| POST | `/api/snippets` | Create a snippet (protected) |
| PUT | `/api/snippets/:id` | Edit a snippet (owner only) |
| DELETE | `/api/snippets/:id` | Delete a snippet (owner only) |
| POST | `/api/snippets/:id/fork` | Fork a public snippet (protected) |

### Versions

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/versions/:snippetId/history` | Get version history |
| GET | `/api/versions/:snippetId/version/:versionNumber` | Get a specific version (reconstructed if not a snapshot) |
| GET | `/api/versions/:snippetId/compare/:baseVersion/:compareVersion` | Compare two versions' code |

### Search

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/search/public?q=term&language=js&tag=react&page=1&limit=12` | Search public snippets (paginated) |

### Analysis

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/analysis/analyze` | Run AI code analysis on a snippet version (protected) |

### Users

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/users/me/stats` | Current user's stats (protected) |
| GET | `/api/users/:userId` | Get a public user profile with their public snippets |
| GET | `/api/users/:userId/stats` | Get a public user's stats |

### Comments & Likes

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/comments/:snippetId` | Get comments for a snippet |
| POST | `/api/comments/:snippetId` | Add a comment (protected) |
| DELETE | `/api/comments/:commentId` | Delete your comment (protected) |
| GET | `/api/likes/:snippetId` | Get like count and liked status |
| POST | `/api/likes/:snippetId` | Like a snippet (protected) |
| DELETE | `/api/likes/:snippetId` | Unlike a snippet (protected) |

## How Versioning Works

1. **Creating a snippet** stores a full snapshot for version 1.
2. **Every save** creates a new version record. When the version is a snapshot (version 1 or every 20th version), the full code is stored. Otherwise, an LCS-based line diff is computed and stored compactly.
3. **Viewing a version** reconstructs the code by finding the nearest snapshot at or before the requested version and replaying stored diffs forward.
4. **Diff viewer** compares two versions' code using the LCS algorithm in `utils/diff.js`, highlighting added lines in green, deleted lines in red, and unchanged lines in gray.

## Future Improvements

- Automated test suite (Jest + React Testing Library)
- CI/CD pipeline
- Dark/light theme toggle
- Real-time collaboration (WebSockets)
- Markdown rendering for snippet descriptions
- Vault-backed secret management