import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { validateWorkEmail, validateWhatsAppNumber } from "@/lib/validation";
import { participantsApi } from "@/lib/apiClient";
import { getWebhookUrls } from "@/hooks/useSettings";

interface Submission {
  id: string;
  participant_id: string;
  overall_score: number;
  level_number: number;
  level_label: string;
  scores: any;
  agent_result: any;
  answers: any;
  pdf_url: string | null;
  created_at: string;
  participants: {
    id: string;
    domain: string;
    original_website: string | null;
    email: string | null;
    full_name: string | null;
    phone_number: string | null;
    consent_to_contact: boolean;
    created_at: string;
  } | null;
}

interface SendReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission;
  mode: "email" | "whatsapp";
  onSuccess?: () => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#f97316";
  return "#ef4444";
};

function generateEmailHtml(submission: Submission, fullName: string): string {
  const { overall_score, level_label, level_number, scores, agent_result, participants } = submission;
  const parsedResult = agent_result;
  const scoreColor = getScoreColor(overall_score);

  const VCL_RED = "#ce2823";
  const VCL_RED_LIGHT = "#fdeded";
  const VCL_NAVY = "#1e293b";
  const VCL_BLACK = "#2e2e2e";
  const SUCCESS_GREEN = "#22c55e";
  const SUCCESS_LIGHT = "#dcfce7";
  const WARNING_AMBER = "#f59e0b";
  const WARNING_LIGHT = "#fef3c7";

  const vclLogoUrl = window.location.origin + '/uploads/email-logo.png';

  const dimensionInsights = parsedResult?.dimensionInsights || [];
  const dimensionRows = dimensionInsights
    .map((dim: any) => {
      const dimColor = getScoreColor(dim.scorePercent);
      const isStrength = dim.strengthOrGap === "Strength";
      const badgeColor = isStrength ? SUCCESS_GREEN : WARNING_AMBER;
      const badgeBg = isStrength ? SUCCESS_LIGHT : WARNING_LIGHT;
      return `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #111827; font-size: 14px; font-weight: 600;">
              ${dim.dimensionTitle}
              <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; background-color: ${badgeBg}; color: ${badgeColor};">${dim.strengthOrGap}</span>
            </td>
            <td style="text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${Math.round(dim.scorePercent)}%</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 10px;">
              <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background-color: ${dimColor}; height: 100%; width: ${dim.scorePercent}%; border-radius: 4px;"></div>
              </div>
            </td>
          </tr>
          ${dim.insight ? `<tr><td colspan="2" style="padding-top: 10px; color: #6b7280; font-size: 13px; line-height: 1.5;">${dim.insight}</td></tr>` : ""}
        </table>
      </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
  `;
    })
    .join("");

  const recommendations90 = (parsedResult?.recommendations?.next90Days || [])
    .map((rec: string) => `<li style="margin-bottom: 10px; padding-left: 5px;">${rec}</li>`)
    .join("");
  const recommendations12 = (parsedResult?.recommendations?.next12Months || [])
    .map((rec: string) => `<li style="margin-bottom: 10px; padding-left: 5px;">${rec}</li>`)
    .join("");

  const readinessWillingnessHtml = parsedResult?.readinessWillingness
    ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <h3 style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">Readiness vs Willingness Analysis</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 48%; padding: 15px; background-color: #f0f5fa; border-radius: 8px; border-left: 3px solid ${VCL_RED};">
              <div style="color: #6b7280; font-size: 13px; margin-bottom: 8px;">Readiness</div>
              <div style="color: #111827; font-size: 20px; font-weight: 600; margin-bottom: 10px;">${Math.round(parsedResult.readinessWillingness.readinessScorePercent)}%</div>
              <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background-color: ${VCL_RED}; height: 100%; width: ${parsedResult.readinessWillingness.readinessScorePercent}%; border-radius: 4px;"></div>
              </div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; padding: 15px; background-color: #f0f5fa; border-radius: 8px; border-left: 3px solid ${VCL_NAVY};">
              <div style="color: #6b7280; font-size: 13px; margin-bottom: 8px;">Willingness</div>
              <div style="color: #111827; font-size: 20px; font-weight: 600; margin-bottom: 10px;">${Math.round(parsedResult.readinessWillingness.willingnessScorePercent)}%</div>
              <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background-color: ${VCL_NAVY}; height: 100%; width: ${parsedResult.readinessWillingness.willingnessScorePercent}%; border-radius: 4px;"></div>
              </div>
            </td>
          </tr>
        </table>
        <div style="margin-top: 15px; padding: 15px; background-color: ${VCL_RED_LIGHT}; border-radius: 8px; border: 1px solid #fecaca;">
          <div style="color: ${VCL_RED}; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
            Gap: ${parsedResult.readinessWillingness.gapPercent >= 0 ? "+" : ""}${parsedResult.readinessWillingness.gapPercent.toFixed(1)}%
          </div>
          ${parsedResult.readinessWillingness.diagnosis ? `<div style="color: #6b7280; font-size: 13px; line-height: 1.5;">${parsedResult.readinessWillingness.diagnosis}</div>` : ""}
        </div>
      </td>
    </tr>
  `
    : "";

  const levelExplanationHtml = parsedResult?.level?.explanation
    ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <div style="background-color: ${VCL_RED_LIGHT}; border-radius: 12px; padding: 20px; border-left: 4px solid ${VCL_RED};">
          <h4 style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 600;">Level ${parsedResult.level.number}: ${parsedResult.level.label}</h4>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${parsedResult.level.explanation}</p>
        </div>
      </td>
    </tr>
  `
    : "";

  const vclPositioningHtml = parsedResult?.vclPositioning?.howVCLCanHelp
    ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <div style="background-color: ${VCL_NAVY}; border-radius: 12px; padding: 25px; color: #ffffff;">
          <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 600;">How VCL can support your AI journey</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #e2e8f0;">${parsedResult.vclPositioning.howVCLCanHelp}</p>
        </div>
      </td>
    </tr>
  `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AI Readiness Assessment Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 25px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <img src="${vclLogoUrl}" alt="VCL - Value Creation Leadership" style="height: 50px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="background-color: ${VCL_BLACK}; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">AI Readiness Assessment</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your personalized results from VCL</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">Dear ${fullName},</p>
              <p style="margin: 15px 0 0; color: #6b7280; font-size: 14px;">Thank you for completing the AI Readiness Assessment. Here are your results for <strong>${participants?.domain || ""}</strong>:</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <h2 style="margin: 0 0 5px; color: ${scoreColor}; font-size: 52px; font-weight: 700;">${Math.round(overall_score)}%</h2>
                    <h3 style="margin: 15px 0 5px; color: #111827; font-size: 22px; font-weight: 600;">${level_label}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Maturity Level</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${parsedResult?.summary ? `<tr><td style="padding: 0 40px 30px;"><h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Summary</h3><p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.7; text-align: justify;">${parsedResult.summary}</p></td></tr>` : ""}
          ${levelExplanationHtml}
          ${readinessWillingnessHtml}
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">Strengths and gaps across key dimensions</h3>
              <table width="100%" cellpadding="0" cellspacing="0">${dimensionRows}</table>
            </td>
          </tr>
          ${
            parsedResult?.recommendations
              ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">Recommendations</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 48%; vertical-align: top; padding: 20px; background-color: #f0fdfa; border-radius: 12px;">
                    <h4 style="margin: 0 0 15px; color: #14b8a6; font-size: 14px; font-weight: 600;">Next 90 Days</h4>
                    <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 1.6;">${recommendations90}</ul>
                  </td>
                  <td style="width: 4%;"></td>
                  <td style="width: 48%; vertical-align: top; padding: 20px; background-color: #eff6ff; border-radius: 12px;">
                    <h4 style="margin: 0 0 15px; color: #1e3a8a; font-size: 14px; font-weight: 600;">Next 12 Months</h4>
                    <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 1.6;">${recommendations12}</ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          ${vclPositioningHtml}
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <h3 style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 600;">Ready to accelerate your AI journey?</h3>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Book a discovery session with our team to discuss your results and next steps.</p>
                    <a href="https://outlook.office.com/book/VCLDigitalIntroMeeting@ttmassociates.com/?ismsaljsauthenabled" style="display: inline-block; background-color: #ce2823; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600;">Book a Discovery Session</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} VCL Solutions. All rights reserved.</p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 11px;">This assessment was generated for ${participants?.domain || ""}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function SendReportDialog({ open, onOpenChange, submission, mode, onSuccess }: SendReportDialogProps) {
  const [name, setName] = useState(submission.participants?.full_name || "");
  const [email, setEmail] = useState(submission.participants?.email || "");
  const [phone, setPhone] = useState(submission.participants?.phone_number || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const isEmail = mode === "email";
  const value = isEmail ? email : phone;
  const setValue = isEmail ? setEmail : setPhone;

  const handleSend = async () => {
    setError(null);

    // Validate name
    if (!name.trim()) {
      setError("Please enter the recipient's name.");
      return;
    }

    // Validate contact info
    if (isEmail) {
      const emailError = validateWorkEmail(value);
      if (emailError) {
        setError(emailError);
        return;
      }
    } else {
      const phoneError = validateWhatsAppNumber(value);
      if (phoneError) {
        setError(phoneError);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Update participant if contact info changed
      const participant = submission.participants;
      const needsUpdate =
        (isEmail && value !== participant?.email) ||
        (!isEmail && value !== participant?.phone_number) ||
        name !== participant?.full_name;

      if (needsUpdate && participant) {
        await participantsApi.updateContact(participant.id, {
          full_name: name.trim(),
          ...(isEmail ? { email: value.trim().toLowerCase() } : { phone_number: value.trim() }),
        }).catch(err => console.error("Error updating participant:", err));
      }

      // Get webhook URL
      const webhookUrls = await getWebhookUrls();
      const webhookUrl = webhookUrls.deliveryWebhookUrl;

      if (!webhookUrl) {
        throw new Error("Delivery webhook URL not configured. Please set it in Settings.");
      }

      // Generate content
      const emailHtml = isEmail ? generateEmailHtml(submission, name.trim()) : null;
      const pdfUrl = submission.pdf_url;

      const payload = {
        deliveryChannel: mode,
        fullName: name.trim(),
        email: isEmail ? value.trim().toLowerCase() : null,
        whatsAppNumber: isEmail ? null : value.replace(/\s/g, ""),
        participant: {
          originalWebsite: submission.participants?.original_website || "",
          domain: submission.participants?.domain || "",
        },
        scores: submission.scores,
        agentInsights: submission.agent_result,
        overallScore: submission.overall_score,
        levelNumber: submission.level_number,
        levelLabel: submission.level_label,
        consentToContact: true,
        emailhtml: emailHtml,
        pdfUrl: pdfUrl || null,
        participantId: submission.participant_id,
        resultId: submission.id,
      };

      console.log("Admin sending report via webhook:", { mode, webhookUrl, payload });

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setStatus("success");
      onSuccess?.();

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        setStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("Error sending report:", err);
      setError(err instanceof Error ? err.message : "Failed to send report. Please try again.");
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEmail ? <Mail className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            Send Report via {isEmail ? "Email" : "WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            Send the assessment report for {submission.participants?.domain || "this submission"}.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-center text-muted-foreground">Report sent successfully!</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Recipient Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">{isEmail ? "Email Address" : "WhatsApp Number"}</Label>
              <Input
                id="contact"
                type={isEmail ? "email" : "tel"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isEmail ? "email@company.com" : "+44 7XXX XXXXXX"}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button onClick={handleSend} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  {isEmail ? <Mail className="mr-2 h-4 w-4" /> : <MessageCircle className="mr-2 h-4 w-4" />}
                  Send Report
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
