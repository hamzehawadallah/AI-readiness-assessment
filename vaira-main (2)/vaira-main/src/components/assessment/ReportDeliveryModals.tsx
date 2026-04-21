import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, MessageCircle, AlertCircle, Loader2 } from "lucide-react";

interface ReportDeliveryModalsProps {
  // Email modal
  emailModalOpen: boolean;
  setEmailModalOpen: (open: boolean) => void;
  emailName: string;
  setEmailName: (name: string) => void;
  emailNameError: string | null;
  setEmailNameError: (error: string | null) => void;
  email: string;
  setEmail: (email: string) => void;
  emailConsent: boolean;
  setEmailConsent: (consent: boolean) => void;
  emailError: string | null;
  setEmailError: (error: string | null) => void;
  emailLoading: boolean;
  
  // WhatsApp modal
  whatsappModalOpen: boolean;
  setWhatsappModalOpen: (open: boolean) => void;
  whatsappName: string;
  setWhatsappName: (name: string) => void;
  whatsappNameError: string | null;
  setWhatsappNameError: (error: string | null) => void;
  whatsappNumber: string;
  setWhatsappNumber: (number: string) => void;
  whatsappConsent: boolean;
  setWhatsappConsent: (consent: boolean) => void;
  whatsappError: string | null;
  setWhatsappError: (error: string | null) => void;
  whatsappLoading: boolean;
  
  // Actions
  onSendEmail: () => void;
  onSendWhatsApp: () => void;
}

export function ReportDeliveryModals({
  emailModalOpen,
  setEmailModalOpen,
  emailName,
  setEmailName,
  emailNameError,
  setEmailNameError,
  email,
  setEmail,
  emailConsent,
  setEmailConsent,
  emailError,
  setEmailError,
  emailLoading,
  whatsappModalOpen,
  setWhatsappModalOpen,
  whatsappName,
  setWhatsappName,
  whatsappNameError,
  setWhatsappNameError,
  whatsappNumber,
  setWhatsappNumber,
  whatsappConsent,
  setWhatsappConsent,
  whatsappError,
  setWhatsappError,
  whatsappLoading,
  onSendEmail,
  onSendWhatsApp,
}: ReportDeliveryModalsProps) {
  return (
    <>
      {/* Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-vcl-teal" />
              Send report by email
            </DialogTitle>
            <DialogDescription>
              Enter your work email to receive a PDF copy of your AI readiness report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-name">Full name</Label>
              <Input
                id="email-name"
                type="text"
                placeholder="Your full name"
                value={emailName}
                onChange={(e) => {
                  setEmailName(e.target.value);
                  setEmailNameError(null);
                }}
                className={emailNameError ? "border-destructive" : ""}
              />
              {emailNameError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailNameError}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-email">Work email</Label>
              <Input
                id="report-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="email-consent"
                checked={emailConsent}
                onCheckedChange={(checked) => setEmailConsent(checked === true)}
                className="mt-1"
              />
              <Label htmlFor="email-consent" className="text-sm text-muted-foreground cursor-pointer">
                I agree to receive this report and occasional insights from VCL about AI and workforce transformation.
              </Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="vcl" 
              onClick={onSendEmail}
              disabled={emailLoading || !emailConsent}
            >
              {emailLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing your PDF...
                </>
              ) : (
                "Send report"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Send report by WhatsApp
            </DialogTitle>
            <DialogDescription>
              Enter your WhatsApp number to receive a PDF copy of your AI readiness report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-name">Full name</Label>
              <Input
                id="whatsapp-name"
                type="text"
                placeholder="Your full name"
                value={whatsappName}
                onChange={(e) => {
                  setWhatsappName(e.target.value);
                  setWhatsappNameError(null);
                }}
                className={whatsappNameError ? "border-destructive" : ""}
              />
              {whatsappNameError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{whatsappNameError}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp-number">WhatsApp number (with country code)</Label>
              <Input
                id="whatsapp-number"
                type="tel"
                placeholder="+971 50 123 4567"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  setWhatsappError(null);
                }}
                className={whatsappError ? "border-destructive" : ""}
              />
              {whatsappError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{whatsappError}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="whatsapp-consent"
                checked={whatsappConsent}
                onCheckedChange={(checked) => setWhatsappConsent(checked === true)}
                className="mt-1"
              />
              <Label htmlFor="whatsapp-consent" className="text-sm text-muted-foreground cursor-pointer">
                I agree to receive this report and occasional follow-up messages from VCL via WhatsApp.
              </Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setWhatsappModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={onSendWhatsApp}
              disabled={whatsappLoading || !whatsappConsent}
            >
              {whatsappLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing your PDF...
                </>
              ) : (
                "Send report"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
