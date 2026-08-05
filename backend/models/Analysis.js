import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    snippetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Snippet',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      index: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    complexity: {
      algorithm: {
        type: String,
        default: '',
      },
      timeComplexity: {
        type: String,
        default: '',
      },
      spaceComplexity: {
        type: String,
        default: '',
      },
    },
    suggestions: {
      type: [String],
      default: [],
    },
    futureSuggestions: {
      type: [String],
      default: [],
    },
    errors: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: '',
    },
    isDSA: {
      type: Boolean,
      default: false,
    },
    referenceCode: {
      type: String,
      default: '',
    },
    optimizedCode: {
      type: String,
      default: '',
    },
    comparisonResult: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'local',
    },
    groqEnabled: {
      type: Boolean,
      default: false,
    },
    groqError: {
      type: String,
      default: '',
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

analysisSchema.index({ snippetId: 1, versionNumber: 1 }, { unique: true });

export default mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema);
