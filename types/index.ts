// Every biomarker from a report
export type BiomarkerStatus = "normal" | "high" | "low" | "critical";

export interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  referenceMin?: number;
  referenceMax?: number;
  status: BiomarkerStatus;
  category: string;
}

// The full report stored in DB
export interface PatientReport {
  id: string;
  patientId: string;
  uploadedAt: string;
  reportDate: string;
  fileName: string;
  rawText: string;
  biomarkers: Biomarker[];
  summary: string;
  doctorQuestions: string[];
  lifestyle: LifestyleRecommendation[];
  trends: TrendInsight[];
  riskFlags: string[];
  status: "processing" | "complete" | "error";
}

export interface LifestyleRecommendation {
  category: "diet" | "exercise" | "sleep" | "stress" | "medication";
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface TrendInsight {
  biomarkerName: string;
  direction: "improving" | "worsening" | "stable";
  message: string;
  dataPoints: { date: string; value: number }[];
}

// Tracks which step the agent pipeline is on
export type AgentStep =
  | "extracting"
  | "analyzing"
  | "pattern_detection"
  | "explaining"
  | "complete"
  | "error";

// Shared state passed between all agents
export interface AgentState {
  reportText: string;
  patientId: string;
  reportId: string;
  biomarkers?: Biomarker[];
  summary?: string;
  trends?: TrendInsight[];
  doctorQuestions?: string[];
  lifestyle?: LifestyleRecommendation[];
  riskFlags?: string[];
  currentStep: AgentStep;
  error?: string;
}