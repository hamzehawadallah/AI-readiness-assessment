import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { validateWorkEmail } from "@/lib/validation";
import { EmailCapture } from "@/types/assessment";
import { ArrowLeft, ArrowRight, Mail, AlertCircle, Shield } from "lucide-react";
import { VCLLogo } from "@/components/VCLLogo";

interface EmailCaptureStepProps {
  initialData: EmailCapture;
  onSubmit: (data: EmailCapture) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function EmailCaptureStep({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
}: EmailCaptureStepProps) {
  const [email, setEmail] = useState(initialData.email);
  const [consent, setConsent] = useState(initialData.consentToContact);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateWorkEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSubmit({ email: email.trim().toLowerCase(), consentToContact: consent });
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <VCLLogo className="h-12 w-auto" />
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-vcl-teal/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-vcl-teal" />
        </div>
        <h2 className="vcl-heading-2 mb-3">Almost there!</h2>
        <p className="vcl-body max-w-lg mx-auto">
          Enter your work email to receive a structured AI readiness summary tailored to your
          organisation, including next step recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="vcl-card space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="vcl-label">
              Work email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className={`h-12 ${error ? "border-destructive" : ""}`}
              disabled={isLoading}
            />
            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              disabled={isLoading}
              className="mt-1"
            />
            <Label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer">
              Send me a copy of my AI Readiness result and occasional insights from VCL about AI
              and workforce transformation.
            </Label>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>Your information is secure and will not be shared with third parties.</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={isLoading}
            className="group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>

          <Button
            type="submit"
            variant="vcl"
            size="lg"
            disabled={isLoading}
            className="group"
          >
            {isLoading ? (
              <>
                <span className="animate-pulse-soft">Analysing...</span>
              </>
            ) : (
              <>
                View my AI readiness result
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
