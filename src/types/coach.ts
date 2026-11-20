export type CourseCategory = "sozel" | "teknik";

export type QuizOptionKey = "A" | "B" | "C" | "D" | "E";

export type AiProviderId =
  | "gemini"
  | "evren"
  | "openai"
  | "anthropic"
  | "groq"
  | "openrouter"
  | "deepseek"
  | "xai"
  | "mistral"
  | "together"
  | "ollama"
  | "custom";

export type AiProviderPreference = "auto" | AiProviderId;

export interface ClientAiOverride {
  provider?: AiProviderPreference;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AvailableProviderInfo {
  id: AiProviderId;
  label: string;
  model: string;
}

export interface AiGenerationMeta {
  provider: AiProviderId;
  providerLabel?: string;
  model: string;
  fallbackFrom?: AiProviderId;
  fallbackReason?: string;
  evrenRemainingCr?: string;
}

export interface AiHealthStatus {
  configured: boolean;
  geminiConfigured: boolean;
  evrenConfigured: boolean;
  model: string;
  geminiModel: string;
  evrenModel: string;
  preferredProvider: AiProviderPreference;
  activeProvider: AiProviderId | null;
  availableProviders?: AvailableProviderInfo[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  category: CourseCategory;
  description: string;
  isCustom?: boolean;
}

export interface CriticalConcept {
  term: string;
  definition: string;
  examTip: string;
  importance: "yuksek" | "orta";
}

export interface TechnicalCodeBreakdown {
  title: string;
  codeOrFormula: string;
  language: string;
  stepByStepLogic: string[];
  commonTrap: string;
}

export interface PracticeTask {
  title: string;
  instruction: string;
  expectedOutcome: string;
}

export interface StudyPlan {
  approachTitle: string;
  actionSteps: string[];
  memorizationTips?: string[];
  keyDefinitionsFocus?: string[];
  codeBreakdowns?: TechnicalCodeBreakdown[];
  practiceTasks?: PracticeTask[];
}

export interface StudySectionNote {
  sectionTitle: string;
  whatToKnow: string[];
  examKeywords: string[];
  likelyQuestionAngle: string;
}

export interface StudyComparisonTable {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface StudyCoverageReport {
  coveredHeadings: string[];
  missedHeadings: string[];
  autoCompletedCount?: number;
}

export interface StudyGuide {
  unitSummary: string;
  detectedCategory: CourseCategory;
  sectionNotes?: StudySectionNote[];
  comparisonTables?: StudyComparisonTable[];
  criticalDetails?: string[];
  criticalConcepts: CriticalConcept[];
  verificationNotes?: string[];
  coverageReport?: StudyCoverageReport;
  studyPlan: StudyPlan;
  generatedAt: string;
  aiMeta?: AiGenerationMeta;
}

export type QuizScope = "guide_aligned" | "full_text";
export type QuizDifficulty = "kolay" | "orta" | "zor";
export type QuizQuestionType =
  | "bilgi"
  | "olumsuz"
  | "oncul"
  | "eslestirme"
  | "ayirt_etme";

export interface QuizOption {
  key: QuizOptionKey;
  text: string;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  unitNumber?: number;
  guideReference?: string;
  questionType?: QuizQuestionType;
  difficulty?: QuizDifficulty;
  question: string;
  codeSnippet?: string;
  options: QuizOption[];
  correctKey: QuizOptionKey;
  distractorStrategy: string;
}

export interface QuizAttempt {
  id: string;
  courseId: string;
  unitNumber: number;
  questions: QuizQuestion[];
  answers: Record<string, QuizOptionKey | "BOS">;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  netScore: number;
  estimatedPoints: number;
  completedAt: string;
}

export interface ReviewItem {
  id: string;
  courseId: string;
  courseName: string;
  unitNumber: number;
  topic: string;
  questionPreview: string;
  wrongChoice?: string;
  correctAnswerSummary: string;
  resolved: boolean;
  /** Aralıklı tekrar aşaması: 0->1.gün, 1->3.gün, 2->7.gün, 3->14.gün, 4->tamamlandı */
  reviewStage?: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
  createdAt: string;
}

export interface ComprehensionPromptItem {
  id: string;
  topic: string;
  question: string;
  expectedPointsHint: string;
}

export interface ComprehensionFeedbackItem {
  id: string;
  scoreLabel: "tam" | "kismi" | "eksik";
  whatWasRight: string;
  missingOrWrong: string;
  sourceReference: string;
}

export interface UnitRecord {
  unitNumber: number;
  rawText: string;
  fileName?: string;
  totalPages?: number;
  contentMode?: "auto" | "full_unit" | "summary";
  completed: boolean;
  guide?: StudyGuide;
  quizHistory: QuizAttempt[];
  updatedAt: string;
}

export interface ExamDates {
  vizeDate: string;
  finalDate: string;
}

export interface CoachState {
  courses: Course[];
  /** Anahtar formatı: `${courseId}::${unitNumber}` */
  units: Record<string, UnitRecord>;
  reviewItems: ReviewItem[];
  examDates: ExamDates;
}
