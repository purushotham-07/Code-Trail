import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    severity: { type: String, default: 'Medium' },
    line: { type: Number, default: null },
    column: { type: Number, default: null },
    description: { type: String, default: '' },
    fix: { type: String, default: '' },
  },
  { _id: false }
);

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
    category: {
      type: String,
      default: '',
    },
    subCategory: {
      type: String,
      default: '',
    },
    isDSA: {
      type: Boolean,
      default: false,
    },
    domain: {
      type: String,
      enum: ['dsa', 'sql'],
      default: 'dsa',
    },
    hasSyntaxErrors: {
      type: Boolean,
      default: false,
    },
    errorLines: {
      type: [Number],
      default: [],
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    ratings: {
      performance: { type: Number, default: 0 },
      readability: { type: Number, default: 0 },
      maintainability: { type: Number, default: 0 },
      security: { type: Number, default: 0 },
      scalability: { type: Number, default: 0 },
    },
    algorithm: {
      type: String,
      default: '',
    },
    approach: {
      type: String,
      default: '',
    },
    complexity: {
      algorithm: { type: String, default: '' },
      timeComplexity: { type: String, default: '' },
      spaceComplexity: { type: String, default: '' },
    },
    targetComplexityMet: {
      type: Boolean,
      default: null,
    },
    dataStructureRecommendations: {
      type: String,
      default: '',
    },
    explanation: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    issues: {
      type: [issueSchema],
      default: [],
    },
    analysisErrors: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    securityIssues: {
      type: [String],
      default: [],
    },
    performanceImprovements: {
      type: [String],
      default: [],
    },
    futureSuggestions: {
      type: [String],
      default: [],
    },
    designPatterns: {
      type: [String],
      default: [],
    },
    correctedCode: {
      type: String,
      default: '',
    },
    optimizedCode: {
      type: String,
      default: '',
    },
    // Polyglot Rosetta solutions (Java, Python, C++, JavaScript)
    polyglotTranslations: {
      java: { type: String, default: '' },
      python: { type: String, default: '' },
      cpp: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },
    // SQL Specific query breakdown and execution pipeline
    sqlAnalysis: {
      clauseOrder: {
        type: [
          {
            clause: String,
            order: Number,
            description: String,
          },
        ],
        default: [],
      },
      antiPatterns: { type: [String], default: [] },
      optimizations: { type: [String], default: [] },
      indexSuggestions: { type: [String], default: [] },
    },
    interviewQuestions: {
      type: [String],
      default: [],
    },
    learningResources: {
      type: [String],
      default: [],
    },
    commonMistakes: {
      type: [String],
      default: [],
    },
    referenceCode: {
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

    // --- Coding Platform Mode fields ---
    problemStatement: {
      type: String,
      default: '',
    },
    isOptimal: {
      type: Boolean,
      default: null,
    },
    recommendedDataStructures: {
      type: [String],
      default: [],
    },
    hints: {
      type: [String],
      default: [],
    },
    approachExplanation: {
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
