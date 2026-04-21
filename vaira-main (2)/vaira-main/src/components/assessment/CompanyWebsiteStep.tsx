import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Globe, AlertCircle, CheckCircle, Building2 } from "lucide-react";
import { CompanyWebsite } from "@/types/assessment";
import { validateWebsite, normalizeWebsiteDomain } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEPARTMENTS = [
  "Executive / C-Suite",
  "Finance",
  "Human Resources",
  "Information Technology",
  "Marketing",
  "Operations",
  "Product",
  "Sales",
  "Customer Service",
  "Research & Development",
  "Legal",
  "Other",
];

interface CompanyWebsiteStepProps {
  initialData: CompanyWebsite;
  onSubmit: (data: CompanyWebsite) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function CompanyWebsiteStep({ initialData, onSubmit, onBack, isLoading = false }: CompanyWebsiteStepProps) {
  const [website, setWebsite] = useState(initialData.originalWebsite);
  const [department, setDepartment] = useState(initialData.department);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    
    const validationError = validateWebsite(website);
    if (validationError) {
      setWebsiteError(validationError);
      hasError = true;
    } else {
      setWebsiteError(null);
    }
    
    if (!department) {
      setDepartmentError("Please select your department");
      hasError = true;
    } else {
      setDepartmentError(null);
    }
    
    if (hasError) return;
    
    const domain = normalizeWebsiteDomain(website);
    onSubmit({
      originalWebsite: website.trim(),
      domain,
      department,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-vcl-teal/10 flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-vcl-teal" />
        </div>
        <h2 className="vcl-heading-2 mb-3">Tell us about yourself</h2>
        <p className="vcl-body max-w-lg mx-auto">
          We use this information to tailor your AI readiness results to your specific context.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="vcl-card space-y-6">
          {/* Website Input */}
          <div className="space-y-2">
            <Label htmlFor="website" className="vcl-label">
              Company website <span className="text-destructive">*</span>
            </Label>
            <Input
              id="website"
              type="text"
              placeholder="examplecorp.com"
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value);
                setWebsiteError(null);
              }}
              className={`h-12 ${websiteError ? "border-destructive" : ""}`}
              disabled={isLoading}
            />
            {websiteError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{websiteError}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your company's website URL (e.g., examplecorp.com or https://examplecorp.com)
            </p>
          </div>

          {/* Department Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="department" className="vcl-label flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Your department <span className="text-destructive">*</span>
            </Label>
            <Select
              value={department}
              onValueChange={(value) => {
                setDepartment(value);
                setDepartmentError(null);
              }}
              disabled={isLoading}
            >
              <SelectTrigger 
                id="department" 
                className={`h-12 bg-background ${departmentError ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {departmentError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{departmentError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={isLoading} className="group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>

          <Button type="submit" variant="vcl" size="lg" disabled={isLoading} className="group">
            {isLoading ? (
              <span className="animate-pulse-soft">Analysing...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
