/**
 * Type definitions for the VCL AI Readiness Assessment
 */

export interface CompanyWebsite {
  originalWebsite: string;
  domain: string;
  department: string;
}

export interface DimensionInsight {
  dimensionKey: string;
  dimensionTitle: string;
  scorePercent: number;
  strengthOrGap: "Strength" | "Gap";
  insight: string;
}

export interface TagInsight {
  tag: string;
  scorePercent: number;
  strengthOrGap: "Strength" | "Gap";
  insight: string;
}

export interface AgentInsights {
  summary: string;
  level: {
    number: number;
    label: string;
    explanation: string;
  };
  readinessWillingness?: {
    readinessScorePercent: number;
    willingnessScorePercent: number;
    gapPercent: number;
    diagnosis: string;
  };
  dimensionInsights: DimensionInsight[];
  tagInsights: TagInsight[];
  recommendations: {
    next90Days: string[];
    next12Months: string[];
  };
  vclPositioning: {
    howVCLCanHelp: string;
    suggestedCallToAction: string;
  };
  sources?: Array<{
    title: string;
    url: string;
  }>;
}

export interface WebhookResponse {
  overallScore: number;
  overallScorePercent: number;
  levelNumber: number;
  levelLabel: string;
  dimensionScores: Array<{
    dimensionKey: string;
    dimensionTitle: string;
    score: number;
    scorePercent: number;
    questionCount: number;
  }>;
  tagScores: Array<{
    tag: string;
    score: number;
    scorePercent: number;
    questionCount: number;
  }>;
  agentInsights?: AgentInsights;
}

export type AssessmentStep = "landing" | "questions" | "website" | "loading" | "results" | "error";
