import { useState } from "react";
import { DELIVERY_WEBHOOK_URL } from "@/config/assessment";
import { validateWorkEmail, validateWhatsAppNumber } from "@/lib/validation";
import { updateParticipantContact } from "@/hooks/useAssessmentStorage";
import { getWebhookUrls } from "@/hooks/useSettings";
import { generateReportBase64, ReportData as PdfReportData } from "@/lib/pdfReportGenerator";
import { ensureLogoInStorage } from "@/lib/pdfLogo";

interface ReportData {
  participant: {
    originalWebsite: string;
    domain: string;
  };
  scores: any;
  agentInsights: any;
  overallScore: number;
  levelNumber: number;
  levelLabel: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return "#22c55e"; // green-500
  if (score >= 60) return "#84cc16"; // lime-500
  if (score >= 40) return "#eab308"; // yellow-500
  if (score >= 20) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
};

/**
 * Generate PDF using the new VCL branded PDF builder
 * NO TRANSPARENCY - all solid colors for maximum compatibility
 */
async function generatePdfBase64(reportData: ReportData, fullName: string): Promise<string> {
  const { overallScore, levelLabel, levelNumber, agentInsights, participant } = reportData;
  const parsedResult = agentInsights;

  // Build dimension insights from agent data
  const dimensionInsights = (parsedResult?.dimensionInsights || []).map((dim: any) => ({
    title: dim.dimensionTitle || "",
    score: dim.scorePercent || 0,
    isStrength: dim.strengthOrGap === "Strength",
    insight: dim.insight || "",
  }));

  // Build report data for PDF generator
  const pdfData: PdfReportData = {
    companyDomain: participant.domain,
    participantName: fullName || participant.domain,
    reportDate: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    overallScore: overallScore,
    levelNumber: levelNumber,
    levelLabel: levelLabel,
    summary: parsedResult?.summary || "",
    levelExplanation: parsedResult?.level?.explanation || "",
    readinessScore: parsedResult?.readinessWillingness?.readinessScorePercent || 0,
    willingnessScore: parsedResult?.readinessWillingness?.willingnessScorePercent || 0,
    gapPercentage: parsedResult?.readinessWillingness?.gapPercent || 0,
    gapDiagnosis: parsedResult?.readinessWillingness?.diagnosis || "",
    dimensionInsights,
    recommendations90Days: parsedResult?.recommendations?.next90Days || [],
    recommendations12Months: parsedResult?.recommendations?.next12Months || [],
    vclPositioning: parsedResult?.vclPositioning?.howVCLCanHelp || "",
  };

  return await generateReportBase64(pdfData);
}

function generateEmailHtml(reportData: ReportData, fullName: string, logoUrl: string, pdfUrl?: string | null): string {
  const { overallScore, levelLabel, levelNumber, scores, agentInsights, participant } = reportData;
  const parsedResult = agentInsights;
  const scoreColor = getScoreColor(overallScore);
  
  // VCL Brand Colors - NO TRANSPARENCY
  const VCL_RED = '#ce2823';
  const VCL_RED_LIGHT = '#fdeded';
  const VCL_NAVY = '#1e293b';
  const VCL_BLACK = '#2e2e2e';
  const SUCCESS_GREEN = '#22c55e';
  const SUCCESS_LIGHT = '#dcfce7';
  const WARNING_AMBER = '#f59e0b';
  const WARNING_LIGHT = '#fef3c7';
  
  const vclLogoUrl = window.location.origin + '/uploads/email-logo.png';
  
  const dimensionInsights = parsedResult?.dimensionInsights || [];
  const dimensionRows = dimensionInsights.map((dim: any) => {
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
          ${dim.insight ? `<tr><td colspan="2" style="padding-top: 10px; color: #6b7280; font-size: 13px; line-height: 1.5;">${dim.insight}</td></tr>` : ''}
        </table>
      </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
  `;
  }).join('');

  const recommendations90 = (parsedResult?.recommendations?.next90Days || []).map((rec: string) => `<li style="margin-bottom: 10px; padding-left: 5px;">${rec}</li>`).join('');
  const recommendations12 = (parsedResult?.recommendations?.next12Months || []).map((rec: string) => `<li style="margin-bottom: 10px; padding-left: 5px;">${rec}</li>`).join('');

  const readinessWillingnessHtml = parsedResult?.readinessWillingness ? `
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
            Gap: ${parsedResult.readinessWillingness.gapPercent >= 0 ? '+' : ''}${parsedResult.readinessWillingness.gapPercent.toFixed(1)}%
          </div>
          ${parsedResult.readinessWillingness.diagnosis ? `<div style="color: #6b7280; font-size: 13px; line-height: 1.5;">${parsedResult.readinessWillingness.diagnosis}</div>` : ''}
        </div>
      </td>
    </tr>
  ` : '';

  const levelExplanationHtml = parsedResult?.level?.explanation ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <div style="background-color: ${VCL_RED_LIGHT}; border-radius: 12px; padding: 20px; border-left: 4px solid ${VCL_RED};">
          <h4 style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 600;">Level ${parsedResult.level.number}: ${parsedResult.level.label}</h4>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${parsedResult.level.explanation}</p>
        </div>
      </td>
    </tr>
  ` : '';

  const vclPositioningHtml = parsedResult?.vclPositioning?.howVCLCanHelp ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <div style="background-color: ${VCL_NAVY}; border-radius: 12px; padding: 25px; color: #ffffff;">
          <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 600;">How VCL can support your AI journey</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #e2e8f0;">${parsedResult.vclPositioning.howVCLCanHelp}</p>
        </div>
      </td>
    </tr>
  ` : '';

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
              <p style="margin: 15px 0 0; color: #6b7280; font-size: 14px; text-align: justify;">Thank you for completing the AI Readiness Assessment. Here are your results for <strong>${participant.domain}</strong>:</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <h2 style="margin: 0 0 5px; color: ${scoreColor}; font-size: 52px; font-weight: 700;">${Math.round(overallScore)}%</h2>
                    <h3 style="margin: 15px 0 5px; color: #111827; font-size: 22px; font-weight: 600;">${levelLabel}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Maturity Level</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${parsedResult?.summary ? `<tr><td style="padding: 0 40px 30px;"><h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Summary</h3><p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.7; text-align: justify;">${parsedResult.summary}</p></td></tr>` : ''}
          ${levelExplanationHtml}
          ${readinessWillingnessHtml}
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">Strengths and gaps across key dimensions</h3>
              <table width="100%" cellpadding="0" cellspacing="0">${dimensionRows}</table>
            </td>
          </tr>
          ${parsedResult?.recommendations ? `
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
          ` : ''}
          ${vclPositioningHtml}
          ${pdfUrl ? `
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f5fa; border-radius: 12px; border: 1px solid #dbeafe;">
                <tr>
                  <td style="padding: 20px 25px; text-align: center;">
                    <p style="margin: 0 0 14px; color: #374151; font-size: 14px; font-weight: 600;">Your full PDF report is ready to download</p>
                    <a href="${pdfUrl}" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 11px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">&#8595; Download PDF Report</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
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
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 11px;">This assessment was generated for ${participant.domain}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type DeliveryStatus = "idle" | "loading" | "success" | "error";

interface DeliveryState {
  email: {
    status: DeliveryStatus;
    message: string;
  };
  whatsapp: {
    status: DeliveryStatus;
    message: string;
  };
}

export function useReportDelivery(
  reportData: ReportData, 
  onSuccess?: () => void,
  savedResultInfo?: { participantId: string; resultId: string; pdfUrl: string } | null
) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  
  const [emailName, setEmailName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConsent, setEmailConsent] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailNameError, setEmailNameError] = useState<string | null>(null);
  
  const [whatsappName, setWhatsappName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappNameError, setWhatsappNameError] = useState<string | null>(null);
  
  const [deliveryState, setDeliveryState] = useState<DeliveryState>({
    email: { status: "idle", message: "" },
    whatsapp: { status: "idle", message: "" },
  });

  const sendReport = async (channel: "email" | "whatsapp") => {
    const isEmail = channel === "email";
    const name = isEmail ? emailName : whatsappName;
    const value = isEmail ? email : whatsappNumber;
    const consent = isEmail ? emailConsent : whatsappConsent;

    // Validate name first
    if (!name.trim()) {
      if (isEmail) {
        setEmailNameError("Please enter your full name.");
      } else {
        setWhatsappNameError("Please enter your full name.");
      }
      return;
    }
    
    // Clear name errors
    if (isEmail) {
      setEmailNameError(null);
    } else {
      setWhatsappNameError(null);
    }

    // Validate contact info
    if (isEmail) {
      const emailValidationError = validateWorkEmail(value);
      if (emailValidationError) {
        setEmailError(emailValidationError);
        return;
      }
      setEmailError(null);
    } else {
      const phoneError = validateWhatsAppNumber(value);
      if (phoneError) {
        setWhatsappError(phoneError);
        return;
      }
      setWhatsappError(null);
    }

    // Set loading
    setDeliveryState(prev => ({
      ...prev,
      [channel]: { status: "loading", message: "" }
    }));

    try {
      // Ensure logo is in storage for email use (PNG format for email client compatibility)
      const logoUrl = isEmail ? await ensureLogoInStorage() : '';
      
      // Generate HTML email template for email delivery
      const emailHtml = isEmail ? generateEmailHtml(reportData, name.trim(), logoUrl, pdfUrl) : null;
      
      // Use the stored PDF URL if available
      const pdfUrl = savedResultInfo?.pdfUrl || null;
      
      console.log("Report delivery - savedResultInfo:", savedResultInfo);
      console.log("Report delivery - pdfUrl:", pdfUrl);

      const payload = {
        deliveryChannel: channel,
        fullName: name.trim(),
        email: isEmail ? value.trim().toLowerCase() : null,
        whatsAppNumber: isEmail ? null : value.replace(/\s/g, ""),
        participant: reportData.participant,
        scores: reportData.scores,
        agentInsights: reportData.agentInsights,
        overallScore: reportData.overallScore,
        levelNumber: reportData.levelNumber,
        levelLabel: reportData.levelLabel,
        consentToContact: consent,
        emailhtml: emailHtml,
        pdfUrl: pdfUrl,
        participantId: savedResultInfo?.participantId || null,
        resultId: savedResultInfo?.resultId || null,
      };
      
      console.log("Report delivery - full payload pdfUrl:", payload.pdfUrl);

      // Fetch dynamic webhook URL
      const { deliveryWebhookUrl } = await getWebhookUrls();

      const response = await fetch(deliveryWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Success
      const successMessage = isEmail 
        ? `Your report has been sent to ${value.trim().toLowerCase()}.`
        : "Your report will be sent shortly by WhatsApp.";
      
      setDeliveryState(prev => ({
        ...prev,
        [channel]: { status: "success", message: successMessage }
      }));

      // Update participant contact info in database
      if (savedResultInfo?.participantId) {
        console.log("Updating participant contact:", {
          participantId: savedResultInfo.participantId,
          email: isEmail ? value.trim().toLowerCase() : null,
          fullName: name.trim(),
          consent,
          phoneNumber: isEmail ? null : value.replace(/\s/g, "")
        });
        const updateSuccess = await updateParticipantContact(
          savedResultInfo.participantId,
          isEmail ? value.trim().toLowerCase() : null,
          name.trim(),
          consent,
          isEmail ? null : value.replace(/\s/g, "") // Save WhatsApp number
        );
        console.log("Participant contact update result:", updateSuccess);
      } else {
        console.warn("No savedResultInfo.participantId available - cannot update participant contact");
      }

      // Close modal
      if (isEmail) {
        setEmailModalOpen(false);
      } else {
        setWhatsappModalOpen(false);
      }
      
      // Call onSuccess callback to unlock content
      onSuccess?.();
    } catch (error) {
      console.error("Report delivery error:", error);
      setDeliveryState(prev => ({
        ...prev,
        [channel]: { status: "error", message: "Failed to send report. Please try again." }
      }));
    }
  };

  const resetEmailForm = () => {
    setEmailName("");
    setEmail("");
    setEmailConsent(true);
    setEmailError(null);
    setEmailNameError(null);
  };

  const resetWhatsappForm = () => {
    setWhatsappName("");
    setWhatsappNumber("");
    setWhatsappConsent(true);
    setWhatsappError(null);
    setWhatsappNameError(null);
  };

  const openEmailModal = () => {
    resetEmailForm();
    setEmailModalOpen(true);
  };

  const openWhatsappModal = () => {
    resetWhatsappForm();
    setWhatsappModalOpen(true);
  };

  return {
    // Email state
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
    emailModalOpen,
    setEmailModalOpen,
    
    // WhatsApp state
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
    whatsappModalOpen,
    setWhatsappModalOpen,
    
    // Delivery state
    deliveryState,
    
    // Actions
    sendReport,
    openEmailModal,
    openWhatsappModal,
  };
}
