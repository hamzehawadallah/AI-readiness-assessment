/**
 * VCL Assessment Report - QUADRANT LAYOUT VERSION
 * 2x2 grid display for the 4 dimensions (inspired by HTML mockup)
 */

import { PdfBuilder } from "./pdfBuilder";
import { VCL_THEME, PDF_LAYOUT, getScoreColor } from "./pdfTheme";
import { getLogoBase64 } from "./pdfLogo";

export interface ReportData {
  companyDomain: string;
  participantName?: string;
  reportDate?: string;
  reportId?: string;
  overallScore: number;
  levelNumber: number;
  levelLabel: string;
  summary: string;
  levelExplanation: string;
  readinessScore: number;
  willingnessScore: number;
  gapPercentage: number;
  gapDiagnosis: string;
  dimensionInsights: Array<{
    title: string;
    score: number;
    isStrength: boolean;
    insight: string;
    evidenceSignals?: string[];
  }>;
  tagInsights?: Array<{
    tag: string;
    scorePercent: number;
    strengthOrGap: string;
    insight: string;
  }>;
  recommendations90Days: string[];
  recommendations12Months: string[];
  vclPositioning: string;
}

function getProgressInLevel(score: number, levelNumber: number): number {
  const levelRanges = [
    { min: 1.0, max: 1.5 },
    { min: 1.5, max: 2.5 },
    { min: 2.5, max: 3.5 },
    { min: 3.5, max: 4.0 },
  ];
  const level = levelRanges[levelNumber - 1];
  if (!level) return 0;
  const progress = ((score - level.min) / (level.max - level.min)) * 100;
  return Math.min(100, Math.max(0, progress));
}

function scoreToPercentage(score: number): number {
  return ((score - 1) / 3) * 100;
}

/**
 * Draw a quadrant with score circle, title, and bullet points
 */
function drawQuadrant(pdf: PdfBuilder, doc: any, x: number, y: number, width: number, height: number, dimension: any) {
  const scoreColors = getScoreColor(dimension.score);

  // Score circle (left side)
  const circleX = x + 25;
  const circleY = y + 25;
  const circleRadius = 20;

  // Outer ring (colored)
  pdf.setDrawColorRgb(scoreColors.main);
  doc.setLineWidth(2);
  doc.circle(circleX, circleY, circleRadius, "S");

  // Inner fill (very light)
  pdf.setFillColorRgb(VCL_THEME.WHITE);
  doc.circle(circleX, circleY, circleRadius - 1.5, "F");

  // Score number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(24);
  pdf.setTextColorRgb(VCL_THEME.GRAY_900);
  const scoreText = `${Math.round(dimension.score)}`;
  const scoreWidth = doc.getTextWidth(scoreText);
  doc.text(scoreText, circleX - scoreWidth / 2, circleY + 4);

  // Title and subtitle (right of circle)
  const textX = x + 55;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  pdf.setTextColorRgb(VCL_THEME.GRAY_900);
  doc.text(dimension.title, textX, y + 18);

  // Subtitle (green, smaller)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  pdf.setTextColorRgb(scoreColors.main);
  const subtitle = dimension.isStrength ? "Strength Area" : "Development Area";
  doc.text(subtitle, textX, y + 26);

  // Bullet points (below)
  const bulletY = y + 42;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  pdf.setTextColorRgb(VCL_THEME.GRAY_600);

  // Main insight
  const insightLines = doc.splitTextToSize(dimension.insight, width - 18);
  pdf.drawDot(x + 8, bulletY + 1, scoreColors.main);
  doc.text(insightLines.slice(0, 2), x + 12, bulletY + 1);

  // Evidence signals (if available)
  if (dimension.evidenceSignals && dimension.evidenceSignals.length > 0) {
    const signal = dimension.evidenceSignals[0]; // Just show first one
    const evidenceY = bulletY + Math.min(insightLines.length, 2) * 3 + 5;
    pdf.drawDot(x + 8, evidenceY + 1, VCL_THEME.GRAY_400);
    const signalLines = doc.splitTextToSize(signal, width - 18);
    doc.text(signalLines.slice(0, 2), x + 12, evidenceY + 1);
  }
}

export function generateVclReport(data: ReportData, logoBase64?: string): PdfBuilder {
  const pdf = new PdfBuilder(logoBase64);

  pdf.setHeaderInfo({
    participantName: data.participantName || data.companyDomain,
    date: data.reportDate,
    reportId: data.reportId || "AI-2024-001",
  });

  const overallScorePercent = data.overallScore <= 4 ? scoreToPercentage(data.overallScore) : data.overallScore;

  const doc = pdf.getDoc();

  // ========== PAGE 1: Hero + Summary ==========
  pdf.drawHeader();

  const heroY = pdf.getCurrentY();
  const heroColors = getScoreColor(overallScorePercent);

  // Eyebrow
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  pdf.setTextColorRgb(heroColors.main);
  doc.text("YOUR AI READINESS RESULT", PDF_LAYOUT.MARGIN_LEFT, heroY);

  // Company name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  pdf.setTextColorRgb(VCL_THEME.GRAY_900);
  doc.text(data.companyDomain, PDF_LAYOUT.MARGIN_LEFT, heroY + 10);

  // Score circle
  pdf.drawScoreCircle(PDF_LAYOUT.PAGE_WIDTH - PDF_LAYOUT.MARGIN_RIGHT - 20, heroY + 12, overallScorePercent, 18);

  pdf.setCurrentY(heroY + 28);

  // Level card
  const levelY = pdf.getCurrentY();
  pdf.drawCard(PDF_LAYOUT.MARGIN_LEFT, levelY, PDF_LAYOUT.CONTENT_WIDTH, 30, {
    bgColor: heroColors.light,
    borderColor: heroColors.main,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  pdf.setTextColorRgb(VCL_THEME.GRAY_500);
  doc.text("MATURITY LEVEL", PDF_LAYOUT.MARGIN_LEFT + 8, levelY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  pdf.setTextColorRgb(heroColors.main);
  doc.text(`Level ${data.levelNumber}`, PDF_LAYOUT.MARGIN_LEFT + 8, levelY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  pdf.setTextColorRgb(VCL_THEME.GRAY_700);
  doc.text(data.levelLabel, PDF_LAYOUT.MARGIN_LEFT + 30, levelY + 16);

  const levelProgress = getProgressInLevel(data.overallScore, data.levelNumber);
  pdf.drawProgressBar(PDF_LAYOUT.MARGIN_LEFT + 8, levelY + 21, PDF_LAYOUT.CONTENT_WIDTH - 16, levelProgress, {
    height: 3,
    useScoreColors: true,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  pdf.setTextColorRgb(VCL_THEME.GRAY_400);
  doc.text(`${Math.round(levelProgress)}% through this level`, PDF_LAYOUT.MARGIN_LEFT + 8, levelY + 27);

  pdf.setCurrentY(levelY + 36);

  // Summary
  pdf.drawSectionDivider();
  pdf.drawHeading("Summary", 2);
  pdf.drawParagraph(data.summary, { fontSize: 8.5, color: VCL_THEME.GRAY_600 });

  pdf.addToY(4);
  pdf.drawHeading("What This Level Means", 3);
  pdf.drawParagraph(data.levelExplanation, { fontSize: 8, color: VCL_THEME.GRAY_500 });

  // ========== PAGE 2: 4 QUADRANTS ==========
  pdf.addNewPage();

  pdf.drawHeading("Four Dimensions of AI Readiness", 1);
  pdf.addToY(8);

  const quadrantStartY = pdf.getCurrentY();
  const quadrantWidth = (PDF_LAYOUT.CONTENT_WIDTH - 10) / 2;
  const quadrantHeight = 85;
  const gap = 10;

  // Ensure we have exactly 4 dimensions
  const dimensions = data.dimensionInsights.slice(0, 4);

  // Top-left: Digital (0)
  if (dimensions[0]) {
    drawQuadrant(pdf, doc, PDF_LAYOUT.MARGIN_LEFT, quadrantStartY, quadrantWidth, quadrantHeight, dimensions[0]);
  }

  // Top-right: Behavioural (1)
  if (dimensions[1]) {
    drawQuadrant(
      pdf,
      doc,
      PDF_LAYOUT.MARGIN_LEFT + quadrantWidth + gap,
      quadrantStartY,
      quadrantWidth,
      quadrantHeight,
      dimensions[1],
    );
  }

  // Bottom-left: Functional (2)
  if (dimensions[2]) {
    drawQuadrant(
      pdf,
      doc,
      PDF_LAYOUT.MARGIN_LEFT,
      quadrantStartY + quadrantHeight + gap,
      quadrantWidth,
      quadrantHeight,
      dimensions[2],
    );
  }

  // Bottom-right: Creative (3)
  if (dimensions[3]) {
    drawQuadrant(
      pdf,
      doc,
      PDF_LAYOUT.MARGIN_LEFT + quadrantWidth + gap,
      quadrantStartY + quadrantHeight + gap,
      quadrantWidth,
      quadrantHeight,
      dimensions[3],
    );
  }

  pdf.setCurrentY(quadrantStartY + quadrantHeight * 2 + gap + 10);

  // ========== Readiness vs Willingness ==========
  pdf.drawSectionDivider();
  pdf.drawHeading("Readiness vs Willingness", 2);

  const rwY = pdf.getCurrentY();
  const cardW = (PDF_LAYOUT.CONTENT_WIDTH - 8) / 2;

  const readinessColors = getScoreColor(data.readinessScore);
  pdf.drawScoreCard(PDF_LAYOUT.MARGIN_LEFT, rwY, cardW, 36, data.readinessScore);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  pdf.setTextColorRgb(VCL_THEME.GRAY_500);
  doc.text("READINESS", PDF_LAYOUT.MARGIN_LEFT + 8, rwY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  pdf.setTextColorRgb(readinessColors.main);
  doc.text(`${Math.round(data.readinessScore)}%`, PDF_LAYOUT.MARGIN_LEFT + 8, rwY + 20);

  pdf.drawScoreBadge(data.readinessScore, PDF_LAYOUT.MARGIN_LEFT + cardW - 32, rwY + 5);

  pdf.drawProgressBar(PDF_LAYOUT.MARGIN_LEFT + 8, rwY + 28, cardW - 16, data.readinessScore, {
    height: 3,
    useScoreColors: true,
  });

  const willX = PDF_LAYOUT.MARGIN_LEFT + cardW + 8;
  const willingnessColors = getScoreColor(data.willingnessScore);
  pdf.drawScoreCard(willX, rwY, cardW, 36, data.willingnessScore);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  pdf.setTextColorRgb(VCL_THEME.GRAY_500);
  doc.text("WILLINGNESS", willX + 8, rwY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  pdf.setTextColorRgb(willingnessColors.main);
  doc.text(`${Math.round(data.willingnessScore)}%`, willX + 8, rwY + 20);

  pdf.drawScoreBadge(data.willingnessScore, willX + cardW - 32, rwY + 5);

  pdf.drawProgressBar(willX + 8, rwY + 28, cardW - 16, data.willingnessScore, { height: 3, useScoreColors: true });

  pdf.setCurrentY(rwY + 42);

  // Gap
  const gapY = pdf.getCurrentY();
  const diagLines = doc.splitTextToSize(data.gapDiagnosis, PDF_LAYOUT.CONTENT_WIDTH - 16);
  const gapH = Math.max(26, diagLines.length * 3.5 + 14);

  pdf.drawCard(PDF_LAYOUT.MARGIN_LEFT, gapY, PDF_LAYOUT.CONTENT_WIDTH, gapH, { bgColor: VCL_THEME.GREEN_TINT_05 });

  const absGap = Math.abs(Math.round(data.gapPercentage));
  const gapSymbol = data.gapPercentage > 5 ? " ↑" : data.gapPercentage < -5 ? " ↓" : " =";
  const gapLabel =
    data.gapPercentage > 5 ? "Readiness Ahead" : data.gapPercentage < -5 ? "Willingness Ahead" : "Aligned";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  pdf.setTextColorRgb(VCL_THEME.PRIMARY_GREEN);
  doc.text(`Gap: ${absGap}%${gapSymbol}`, PDF_LAYOUT.MARGIN_LEFT + 8, gapY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  pdf.setTextColorRgb(VCL_THEME.GRAY_500);
  doc.text(gapLabel, PDF_LAYOUT.MARGIN_LEFT + 42, gapY + 8);

  doc.setFontSize(8);
  pdf.setTextColorRgb(VCL_THEME.GRAY_600);
  doc.text(diagLines, PDF_LAYOUT.MARGIN_LEFT + 8, gapY + 15);

  pdf.setCurrentY(gapY + gapH + 8);

  // ========== PAGE 3: Recommendations ==========
  pdf.checkPageBreak(85);
  pdf.drawSectionDivider();
  pdf.drawHeading("Recommended Actions", 2);

  const recY = pdf.getCurrentY();
  const recW = (PDF_LAYOUT.CONTENT_WIDTH - 8) / 2;
  const recH = 70;

  pdf.drawCard(PDF_LAYOUT.MARGIN_LEFT, recY, recW, recH, {
    bgColor: VCL_THEME.GREEN_TINT_05,
    borderColor: VCL_THEME.PRIMARY_GREEN,
  });

  pdf.drawDot(PDF_LAYOUT.MARGIN_LEFT + 8, recY + 8, VCL_THEME.PRIMARY_GREEN);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  pdf.setTextColorRgb(VCL_THEME.GRAY_800);
  doc.text("Next 90 Days", PDF_LAYOUT.MARGIN_LEFT + 12, recY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  pdf.setTextColorRgb(VCL_THEME.GRAY_600);

  let recTextY = recY + 17;
  data.recommendations90Days.slice(0, 4).forEach((rec) => {
    if (recTextY > recY + recH - 6) return;
    pdf.drawDot(PDF_LAYOUT.MARGIN_LEFT + 8, recTextY, VCL_THEME.GRAY_400);
    const recLines = doc.splitTextToSize(rec, recW - 18);
    doc.text(recLines.slice(0, 2), PDF_LAYOUT.MARGIN_LEFT + 12, recTextY + 1);
    recTextY += Math.min(recLines.length, 2) * 3 + 4;
  });

  const rec12X = PDF_LAYOUT.MARGIN_LEFT + recW + 8;
  pdf.drawCard(rec12X, recY, recW, recH, { bgColor: VCL_THEME.GRAY_100, borderColor: VCL_THEME.GRAY_300 });

  pdf.drawDot(rec12X + 8, recY + 8, VCL_THEME.GRAY_500);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  pdf.setTextColorRgb(VCL_THEME.GRAY_800);
  doc.text("Next 12 Months", rec12X + 12, recY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  pdf.setTextColorRgb(VCL_THEME.GRAY_600);

  recTextY = recY + 17;
  data.recommendations12Months.slice(0, 4).forEach((rec) => {
    if (recTextY > recY + recH - 6) return;
    pdf.drawDot(rec12X + 8, recTextY, VCL_THEME.GRAY_400);
    const recLines = doc.splitTextToSize(rec, recW - 18);
    doc.text(recLines.slice(0, 2), rec12X + 12, recTextY + 1);
    recTextY += Math.min(recLines.length, 2) * 3 + 4;
  });

  pdf.setCurrentY(recY + recH + 10);

  // VCL Positioning
  pdf.checkPageBreak(40);
  pdf.drawSectionDivider();

  const vclY = pdf.getCurrentY();
  const vclLines = doc.splitTextToSize(data.vclPositioning, PDF_LAYOUT.CONTENT_WIDTH - 16);
  const vclH = Math.max(35, vclLines.length * 4 + 16);

  pdf.drawCard(PDF_LAYOUT.MARGIN_LEFT, vclY, PDF_LAYOUT.CONTENT_WIDTH, vclH, { bgColor: VCL_THEME.GRAY_900 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  pdf.setTextColorRgb(VCL_THEME.WHITE);
  doc.text("How VCL Can Help", PDF_LAYOUT.MARGIN_LEFT + 8, vclY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  pdf.setTextColorRgb(VCL_THEME.GRAY_400);
  doc.text(vclLines, PDF_LAYOUT.MARGIN_LEFT + 8, vclY + 18);

  pdf.setCurrentY(vclY + vclH + 8);

  // CTA
  const ctaY = pdf.getCurrentY();
  pdf.drawCard(PDF_LAYOUT.MARGIN_LEFT, ctaY, PDF_LAYOUT.CONTENT_WIDTH, 28, {
    bgColor: VCL_THEME.GREEN_TINT_05,
    borderColor: VCL_THEME.PRIMARY_GREEN,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  pdf.setTextColorRgb(VCL_THEME.PRIMARY_GREEN);
  doc.text("Ready to Take the Next Step?", PDF_LAYOUT.MARGIN_LEFT + 8, ctaY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  pdf.setTextColorRgb(VCL_THEME.GRAY_600);
  doc.text("Book a discovery session to discuss your results and next steps.", PDF_LAYOUT.MARGIN_LEFT + 8, ctaY + 16);

  const btnW = 50;
  const btnH = 7;
  const btnX = PDF_LAYOUT.MARGIN_LEFT + 8;
  const btnY = ctaY + 19;

  pdf.setFillColorRgb(VCL_THEME.PRIMARY_GREEN);
  doc.roundedRect(btnX, btnY, btnW, btnH, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  pdf.setTextColorRgb(VCL_THEME.GRAY_900);
  doc.text("BOOK A DISCOVERY CALL", btnX + 4, btnY + 4.5);

  doc.link(btnX, btnY, btnW, btnH, {
    url: "https://outlook.office.com/book/VCLDigitalIntroMeeting@ttmassociates.com/?ismsaljsauthenabled",
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    pdf.drawFooter();
  }

  return pdf;
}

export async function generateReportBase64(data: ReportData): Promise<string> {
  const logoBase64 = await getLogoBase64();
  const pdf = generateVclReport(data, logoBase64);
  return pdf.toBase64();
}

export function generateReportBase64Sync(data: ReportData, logoBase64?: string): string {
  const pdf = generateVclReport(data, logoBase64);
  return pdf.toBase64();
}

export async function generateReportBlob(data: ReportData): Promise<Blob> {
  const logoBase64 = await getLogoBase64();
  const pdf = generateVclReport(data, logoBase64);
  return pdf.toBlob();
}

export async function generateReportDataUri(data: ReportData): Promise<string> {
  const logoBase64 = await getLogoBase64();
  const pdf = generateVclReport(data, logoBase64);
  return pdf.toDataUri();
}
