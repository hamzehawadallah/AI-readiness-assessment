import { participantsApi, resultsApi, uploadApi } from "@/lib/apiClient";
import { generateReportBlob } from "@/lib/pdfReportGenerator";

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
  answers?: any;
}

export async function saveAssessmentResult(
  reportData: ReportData,
  answers: any,
): Promise<{ participantId: string; resultId: string; pdfUrl: string } | null> {
  try {
    // 1. Create participant
    const { id: participantId } = await participantsApi.create({
      domain:           reportData.participant.domain,
      original_website: reportData.participant.originalWebsite,
    });

    // 2. Create assessment result
    const { id: resultId } = await resultsApi.create({
      participant_id: participantId,
      overall_score:  reportData.overallScore,
      level_number:   reportData.levelNumber,
      level_label:    reportData.levelLabel,
      scores:         reportData.scores,
      agent_result:   reportData.agentInsights,
      answers:        answers,
    });

    // 3. Generate PDF
    const agentResult = reportData.agentInsights || {};
    const dimensionInsights = (agentResult?.dimensionInsights || []).map((d: any) => ({
      title:      d.dimensionTitle || '',
      score:      d.scorePercent   || 0,
      isStrength: d.strengthOrGap  === 'Strength',
      insight:    d.insight        || '',
    }));

    const pdfData = {
      companyDomain:         reportData.participant.domain,
      participantName:       reportData.participant.domain,
      reportDate:            new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      overallScore:          reportData.overallScore,
      levelNumber:           reportData.levelNumber,
      levelLabel:            reportData.levelLabel,
      summary:               agentResult?.summary               || '',
      levelExplanation:      agentResult?.level?.explanation    || '',
      readinessScore:        agentResult?.readinessWillingness?.readinessScorePercent  || 0,
      willingnessScore:      agentResult?.readinessWillingness?.willingnessScorePercent || 0,
      gapPercentage:         agentResult?.readinessWillingness?.gapPercent             || 0,
      gapDiagnosis:          agentResult?.readinessWillingness?.diagnosis              || '',
      dimensionInsights,
      recommendations90Days:   agentResult?.recommendations?.next90Days   || [],
      recommendations12Months: agentResult?.recommendations?.next12Months || [],
      vclPositioning:          agentResult?.vclPositioning?.howVCLCanHelp || '',
    };

    // 4. Generate & upload PDF (non-blocking — failure does not prevent results from showing)
    let pdfUrl = '';
    try {
      const pdfBlob = await generateReportBlob(pdfData);
      const filename = `report-${resultId}`;
      const uploadResult = await uploadApi.uploadPdf(pdfBlob, filename + '.pdf');
      pdfUrl = uploadResult.url;
      await resultsApi.updatePdfUrl(resultId, pdfUrl);
    } catch (pdfErr) {
      console.warn('PDF generation/upload failed (non-fatal):', pdfErr);
    }

    return { participantId, resultId, pdfUrl };
  } catch (err) {
    console.error('Error saving assessment result:', err);
    return null;
  }
}

export async function updateParticipantContact(
  participantId: string,
  email: string | null,
  fullName: string,
  consentToContact: boolean,
  phoneNumber?: string | null,
): Promise<boolean> {
  try {
    await participantsApi.updateContact(participantId, {
      full_name:          fullName,
      email:              email ?? undefined,
      phone_number:       phoneNumber ?? undefined,
      consent_to_contact: consentToContact,
    });
    return true;
  } catch (err) {
    console.error('Error updating participant contact:', err);
    return false;
  }
}
