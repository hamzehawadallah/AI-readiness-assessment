import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { VCL_CONTACT } from "@/config/assessment";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <h2 className="vcl-heading-2 mb-3">Something went wrong</h2>
        <p className="vcl-body mb-8">
          We couldn't generate your AI readiness result. This might be a temporary issue. Please
          try again, or contact the VCL team if the problem persists.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="vcl" size="lg" onClick={onRetry} className="group">
            <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180" />
            Try again
          </Button>
          
          <Button variant="outline" size="lg" asChild>
            <a href={`mailto:${VCL_CONTACT.email}?subject=AI%20Readiness%20Assessment%20Issue`}>
              <Mail className="w-4 h-4" />
              Contact VCL
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
