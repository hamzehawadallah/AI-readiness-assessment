import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LIKERT_SCALE } from "@/config/assessment";
import { DynamicDimension, DynamicAnswers } from "@/hooks/useDynamicAssessment";
import { ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicQuestionsStepProps {
  dimensions: DynamicDimension[];
  initialAnswers: DynamicAnswers;
  onNext: (answers: DynamicAnswers) => void;
  onBack?: () => void;
}

export function DynamicQuestionsStep({ 
  dimensions, 
  initialAnswers, 
  onNext, 
  onBack 
}: DynamicQuestionsStepProps) {
  const [answers, setAnswers] = useState<DynamicAnswers>(initialAnswers);
  const [currentDimension, setCurrentDimension] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const dimension = dimensions[currentDimension];
  const dimensionKey = dimension?.dimension_key;

  const handleAnswer = (questionIndex: number, value: number) => {
    setError(null);
    setAnswers((prev) => {
      const newDimensionAnswers = [...(prev[dimensionKey] || [])];
      newDimensionAnswers[questionIndex] = value;
      return {
        ...prev,
        [dimensionKey]: newDimensionAnswers,
      };
    });
  };

  const isCurrentDimensionComplete = () => {
    const dimAnswers = answers[dimensionKey] || [];
    return dimension?.questions.every((_, idx) => dimAnswers[idx] !== undefined && dimAnswers[idx] !== 0);
  };

  const isAllComplete = () => {
    return dimensions.every((dim) => {
      const dimAnswers = answers[dim.dimension_key] || [];
      return dim.questions.every((_, idx) => dimAnswers[idx] !== undefined && dimAnswers[idx] !== 0);
    });
  };

  const handleNext = () => {
    if (!isCurrentDimensionComplete()) {
      setError("Please answer all questions before continuing.");
      return;
    }

    if (currentDimension < dimensions.length - 1) {
      setCurrentDimension((prev) => prev + 1);
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (isAllComplete()) {
        onNext(answers);
      } else {
        setError("Please complete all questions across all dimensions.");
      }
    }
  };

  const handlePrevious = () => {
    if (currentDimension > 0) {
      setCurrentDimension((prev) => prev - 1);
      setError(null);
    } else if (onBack) {
      onBack();
    }
  };

  const showBackButton = currentDimension > 0 || !!onBack;

  const getTotalProgress = () => {
    const totalQuestions = dimensions.reduce((acc, dim) => acc + dim.questions.length, 0);
    const answeredQuestions = Object.entries(answers)
      .reduce((acc, [key, vals]) => {
        const dim = dimensions.find(d => d.dimension_key === key);
        if (!dim) return acc;
        return acc + vals.filter((a, idx) => idx < dim.questions.length && a !== undefined && a !== 0).length;
      }, 0);
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  if (!dimension) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="vcl-heading-2 mb-3">AI-Readiness Assessment</h2>
        <p className="vcl-body">Rate how strongly you agree or disagree with each statement about your organisation.</p>
      </div>

      {/* Dimension Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {dimensions.map((dim, idx) => {
            const dimAnswers = answers[dim.dimension_key] || [];
            const isComplete = dim.questions.every((_, qIdx) => dimAnswers[qIdx] !== undefined && dimAnswers[qIdx] !== 0);
            const isCurrent = idx === currentDimension;

            return (
              <button
                key={dim.id}
                onClick={() => setCurrentDimension(idx)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isCurrent
                    ? "bg-vcl-teal text-accent-foreground shadow-md"
                    : isComplete
                      ? "bg-vcl-teal/20 text-vcl-teal hover:bg-vcl-teal/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {dim.short_title}
                {isComplete && !isCurrent && " ✓"}
              </button>
            );
          })}
        </div>

        {/* Overall progress */}
        <div className="mt-4 text-center text-sm text-muted-foreground">Overall progress: {getTotalProgress()}%</div>
      </div>

      {/* Current Dimension Card */}
      <div className="vcl-card mb-6">
        <div className="mb-6 pb-6 border-b border-border">
          <h3 className="vcl-heading-3 text-vcl-teal mb-2">{dimension.title}</h3>
          <p className="text-muted-foreground">{dimension.description}</p>
        </div>

        <div className="space-y-8">
          {dimension.questions.map((question, qIdx) => (
            <div key={question.id} className="space-y-4">
              <p className="text-foreground font-medium">
                {qIdx + 1}. {question.text}
              </p>

              {question.question_type === "rating" ? (
                // Rating type: 1-5 Likert scale
                <RadioGroup
                  value={(answers[dimensionKey]?.[qIdx])?.toString() || ""}
                  onValueChange={(value) => handleAnswer(qIdx, parseInt(value))}
                  className="grid grid-cols-5 gap-2"
                >
                  {LIKERT_SCALE.map((option) => (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`${question.id}-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all w-full",
                          "hover:border-vcl-teal/50 hover:bg-vcl-teal/5",
                          "peer-data-[state=checked]:border-vcl-teal peer-data-[state=checked]:bg-vcl-teal/10",
                          "border-input bg-card",
                        )}
                      >
                        <span className="text-base sm:text-lg font-semibold text-foreground">{option.value}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground text-center mt-0.5 sm:mt-1 leading-tight">
                          {option.label}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                // Selection type: custom options with grades
                <RadioGroup
                  value={(answers[dimensionKey]?.[qIdx])?.toString() || ""}
                  onValueChange={(value) => handleAnswer(qIdx, parseFloat(value))}
                  className="flex flex-col gap-2"
                >
              {question.options
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((option, optIdx) => (
                      <div key={option.id}>
                        <RadioGroupItem
                          value={(optIdx + 1).toString()}
                          id={`${question.id}-${option.id}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`${question.id}-${option.id}`}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all w-full",
                            "hover:border-vcl-teal/50 hover:bg-vcl-teal/5",
                            "peer-data-[state=checked]:border-vcl-teal peer-data-[state=checked]:bg-vcl-teal/10",
                            "border-input bg-card",
                          )}
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {optIdx + 1}
                          </span>
                          <span className="text-sm sm:text-base text-foreground">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={cn("flex", showBackButton ? "justify-between" : "justify-end")}>
        {showBackButton && (
          <Button type="button" variant="outline" size="lg" onClick={handlePrevious} className="group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
        )}

        <Button type="button" variant="vcl" size="lg" onClick={handleNext} className="group">
          {currentDimension === dimensions.length - 1 ? "Continue to results" : "Next dimension"}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
