import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    snippetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Snippet",
      required: true,
    },

    versionNumber: {
      type: Number,
      required: true,
    },

    snapshot: {
      type: Boolean,
      default: false,
    },

    // Only snapshots store the complete code
    fullCode: {
      type: String,
      default: "",
      required: function () {
        return this.snapshot;
      },
    },

    // Diff for non-snapshot versions
    diff: {
      type: String,
      default: "",
    },

    commitMessage: {
      type: String,
      default: "",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

versionSchema.index(
  { snippetId: 1, versionNumber: 1 },
  { unique: true }
);

export default mongoose.model("Version", versionSchema);