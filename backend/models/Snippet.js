import mongoose from "mongoose";

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Domain: 'dsa' | 'sql'
    domain: {
      type: String,
      enum: ["dsa", "sql"],
      default: "dsa",
      index: true,
    },

    // Difficulty: 'Easy' | 'Medium' | 'Hard'
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
      index: true,
    },

    // Topic/Pattern (e.g. 'Sliding Window', 'Dynamic Programming', 'Window Functions', 'CTEs')
    topic: {
      type: String,
      default: "General",
      trim: true,
      index: true,
    },

    // Programming language: 'java', 'python', 'cpp', 'javascript', 'sql'
    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Target complexities
    targetTimeComplexity: {
      type: String,
      default: "",
      trim: true,
    },

    targetSpaceComplexity: {
      type: String,
      default: "",
      trim: true,
    },

    // Test cases for verification
    testCases: [
      {
        input: { type: String, default: "" },
        output: { type: String, default: "" },
        explanation: { type: String, default: "" },
      },
    ],

    // SQL Schema definition (DDL + mock seed data)
    sqlSchema: {
      type: String,
      default: "",
    },

    // SQL Dialect
    sqlDialect: {
      type: String,
      enum: ["standard", "postgresql", "mysql", "sqlite"],
      default: "standard",
    },

    // Polyglot solutions (Java, Python, C++, JavaScript)
    polyglotSolutions: {
      java: { type: String, default: "" },
      python: { type: String, default: "" },
      cpp: { type: String, default: "" },
      javascript: { type: String, default: "" },
    },

    tags: [
      {
        type: String,
      },
    ],

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    currentVersion: {
      type: Number,
      default: 1,
    },

    forkCount: {
      type: Number,
      default: 0,
    },

    forkInfo: {
      sourceSnippetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Snippet",
        default: null,
      },

      forkedFrom: {
        type: String,
        default: "",
      },
    },

    // Coding platform problem statement & constraints
    problemStatement: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/*
||--------------------------------------------------------------------------
|| INDEXES
||--------------------------------------------------------------------------
*/

// Text search on title, topic, tags, and problem statement
snippetSchema.index(
  {
    title: "text",
    topic: "text",
    tags: "text",
    problemStatement: "text",
  },
  {
    language_override: "mongoLanguage",
  }
);

// Search & filter indexes
snippetSchema.index({ domain: 1, updatedAt: -1 });
snippetSchema.index({ domain: 1, difficulty: 1, topic: 1 });
snippetSchema.index({ language: 1 });
snippetSchema.index({ owner: 1, updatedAt: -1 });
snippetSchema.index({ isPublic: 1, updatedAt: -1 });
snippetSchema.index({ forkCount: -1 });

export default mongoose.model("Snippet", snippetSchema);
