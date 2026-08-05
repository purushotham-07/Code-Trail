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

    // Programming language
    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

// Text search only on title and tags
snippetSchema.index(
  {
    title: "text",
    tags: "text",
  },
  {
    language_override: "mongoLanguage",
  }
);

// Search/filter by programming language
snippetSchema.index({ language: 1 });

// Dashboard
snippetSchema.index({ owner: 1, updatedAt: -1 });

// Public feed
snippetSchema.index({ isPublic: 1, updatedAt: -1 });

// Trending
snippetSchema.index({ forkCount: -1 });

export default mongoose.model("Snippet", snippetSchema);