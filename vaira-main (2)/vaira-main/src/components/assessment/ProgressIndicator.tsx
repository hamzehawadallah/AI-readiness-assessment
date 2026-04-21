import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-vcl-teal rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step labels - hidden on mobile, shown on md+ */}
      <div className="hidden md:flex justify-between">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              idx <= currentStep ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                idx < currentStep
                  ? "bg-vcl-teal text-accent-foreground"
                  : idx === currentStep
                  ? "bg-vcl-teal/20 text-vcl-teal border-2 border-vcl-teal"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {idx < currentStep ? (
                <Check className="w-3 h-3" />
              ) : (
                idx + 1
              )}
            </div>
            <span className="hidden lg:inline">{step}</span>
          </div>
        ))}
      </div>
      
      {/* Mobile step indicator */}
      <div className="md:hidden text-center">
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}: <span className="text-foreground font-medium">{steps[currentStep]}</span>
        </span>
      </div>
    </div>
  );
}
