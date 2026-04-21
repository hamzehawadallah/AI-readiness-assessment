import { useState, useCallback, useEffect } from "react";
import { LandingSection } from "./LandingSection";
import { ProgressIndicator } from "./ProgressIndicator";
import { DynamicQuestionsStep } from "./DynamicQuestionsStep";
import { CompanyWebsiteStep } from "./CompanyWebsiteStep";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { ResultsDisplay } from "./ResultsDisplay";
import { saveAssessmentResult } from "@/hooks/useAssessmentStorage";
import { useDynamicAssessment, DynamicAnswers } from "@/hooks/useDynamicAssessment";
import { getWebhookUrls } from "@/hooks/useSettings";
import { calculateScores, buildQuestionsPayload } from "@/lib/scoreCalculations";
import {
  AssessmentStep,
  CompanyWebsite,
  WebhookResponse,
} from "@/types/assessment";
import { Loader2 } from "lucide-react";

const STEPS = ["Assessment", "Organisation", "Results"];

const initialWebsiteData: CompanyWebsite = {
  originalWebsite: "",
  domain: "",
  department: "",
};

export function AssessmentFlow() {
  const { dimensions, isLoading: dimensionsLoading, createInitialAnswers } = useDynamicAssessment();
  const [currentStep, setCurrentStep] = useState<AssessmentStep>("landing");
  const [answers, setAnswers] = useState<DynamicAnswers>({});
  const [websiteData, setWebsiteData] = useState<CompanyWebsite>(initialWebsiteData);
  const [results, setResults] = useState<WebhookResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedResultInfo, setSavedResultInfo] = useState<{
    participantId: string;
    resultId: string;
    pdfUrl: string;
  } | null>(null);

  // Initialize answers when dimensions are loaded
  useEffect(() => {
    if (dimensions.length > 0 && Object.keys(answers).length === 0) {
      setAnswers(createInitialAnswers());
    }
  }, [dimensions, createInitialAnswers, answers]);

  const getStepIndex = () => {
    switch (currentStep) {
      case "questions":
        return 0;
      case "website":
        return 1;
      case "results":
      case "loading":
      case "error":
        return 2;
      default:
        return 0;
    }
  };

  const handleStartAssessment = () => {
    if (dimensions.length > 0) {
      setAnswers(createInitialAnswers());
    }
    setCurrentStep("questions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuestionsComplete = (data: DynamicAnswers) => {
    setAnswers(data);
    setCurrentStep("website");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToQuestions = () => {
    setCurrentStep("questions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAssessment = useCallback(async (website: CompanyWebsite) => {
    setWebsiteData(website);
    setIsLoading(true);
    setCurrentStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Calculate scores locally
    const calculatedScores = calculateScores(dimensions, answers);
    const questionsPayload = buildQuestionsPayload(dimensions, answers);

    const payload = {
      participant: {
        originalWebsite: website.originalWebsite,
        domain: website.domain,
        department: website.department,
      },
      answers: answers,
      questions: questionsPayload,
      scores: {
        overall: calculatedScores.overallScore,
        overallPercent: calculatedScores.overallScorePercent,
        levelNumber: calculatedScores.levelNumber,
        levelLabel: calculatedScores.levelLabel,
        dimensions: calculatedScores.dimensionScores,
        tags: calculatedScores.tagScores,
      },
    };

    try {
      // Fetch dynamic webhook URL
      const { webhookUrl } = await getWebhookUrls();
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      
      // The webhook returns an array, so get the first item (this contains the agent insights directly)
      const agentInsights = Array.isArray(rawData) ? rawData[0] : rawData;
      
      // Build WebhookResponse with calculated scores + agent insights from webhook
      const webhookResponse: WebhookResponse = {
        overallScore: calculatedScores.overallScore,
        overallScorePercent: calculatedScores.overallScorePercent,
        levelNumber: calculatedScores.levelNumber,
        levelLabel: calculatedScores.levelLabel,
        dimensionScores: calculatedScores.dimensionScores,
        tagScores: calculatedScores.tagScores,
        agentInsights: agentInsights,
      };

      setResults(webhookResponse);
      
      // Save to database and storage
      const reportData = {
        participant: {
          originalWebsite: website.originalWebsite,
          domain: website.domain,
          department: website.department,
        },
        scores: {
          overall: calculatedScores.overallScore,
          overallPercent: calculatedScores.overallScorePercent,
          levelNumber: calculatedScores.levelNumber,
          levelLabel: calculatedScores.levelLabel,
          dimensions: calculatedScores.dimensionScores,
          tags: calculatedScores.tagScores,
        },
        agentInsights: agentInsights,
        overallScore: calculatedScores.overallScorePercent,
        levelNumber: calculatedScores.levelNumber,
        levelLabel: calculatedScores.levelLabel,
      };
      
      const savedInfo = await saveAssessmentResult(reportData, answers);
      if (savedInfo) {
        setSavedResultInfo(savedInfo);
      }
      
      setCurrentStep("results");
    } catch (error) {
      console.error("Assessment submission error:", error);
      setCurrentStep("error");
    } finally {
      setIsLoading(false);
    }
  }, [answers, dimensions]);

  const handleRetry = () => {
    submitAssessment(websiteData);
  };

  if (currentStep === "landing") {
    return dimensionsLoading ? (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ) : (
      <LandingSection onStart={handleStartAssessment} />
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="vcl-container">
        {/* Progress Indicator - hide on landing, loading, error, and results */}
        {!["loading", "error", "results"].includes(currentStep) && (
          <div className="mb-8 md:mb-12">
            <ProgressIndicator steps={STEPS} currentStep={getStepIndex()} />
          </div>
        )}

        {/* Step Content */}
        {currentStep === "questions" && dimensions.length > 0 && (
          <DynamicQuestionsStep
            dimensions={dimensions}
            initialAnswers={answers}
            onNext={handleQuestionsComplete}
          />
        )}

        {currentStep === "website" && (
          <CompanyWebsiteStep
            initialData={websiteData}
            onSubmit={submitAssessment}
            onBack={handleBackToQuestions}
            isLoading={isLoading}
          />
        )}

        {currentStep === "loading" && <LoadingState />}

        {currentStep === "error" && <ErrorState onRetry={handleRetry} />}

        {currentStep === "results" && results && (
          <ResultsDisplay 
            results={results} 
            participant={websiteData}
            savedResultInfo={savedResultInfo}
          />
        )}
      </div>
    </div>
  );
}
