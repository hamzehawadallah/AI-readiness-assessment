/**
 * PDF Builder - MODERN DESIGN VERSION
 * Inspired by minimalist green-accent designs
 * Uses jsPDF v3.0.4 - NO TRANSPARENCY/ALPHA
 */

import jsPDF from "jspdf";
import { VCL_THEME, PDF_LAYOUT, RGBColor, getScoreColor, getGradientColor } from "./pdfTheme";

export class PdfBuilder {
  private doc: jsPDF;
  private currentY: number;
  private logoBase64: string | null = null;
  private headerInfo: { participantName?: string; date?: string; reportId?: string } = {};

  constructor(logoBase64?: string) {
    this.doc = new jsPDF("p", "mm", "a4");
    this.currentY = PDF_LAYOUT.MARGIN_TOP;
    this.logoBase64 = logoBase64 || null;
  }

  setLogoBase64(logo: string): void {
    this.logoBase64 = logo;
  }

  setFillColorRgb(color: RGBColor): void {
    this.doc.setFillColor(color.r, color.g, color.b);
  }

  setTextColorRgb(color: RGBColor): void {
    this.doc.setTextColor(color.r, color.g, color.b);
  }

  setDrawColorRgb(color: RGBColor): void {
    this.doc.setDrawColor(color.r, color.g, color.b);
  }

  setHeaderInfo(info: { participantName?: string; date?: string; reportId?: string }): void {
    this.headerInfo = info;
  }

  /**
   * MODERN: Minimal header with thin separator
   */
  drawHeader(): void {
    const startY = 12;
    const leftX = PDF_LAYOUT.MARGIN_LEFT;
    const rightX = PDF_LAYOUT.PAGE_WIDTH - PDF_LAYOUT.MARGIN_RIGHT;

    // Logo on left (if available)
    if (this.logoBase64) {
      try {
        const logoAspectRatio = 978 / 434;
        const logoHeight = 10;
        const logoWidth = logoHeight * logoAspectRatio;
        this.doc.addImage(this.logoBase64, "PNG", leftX, startY, logoWidth, logoHeight);
      } catch (error) {
        this.drawMinimalLogo(leftX, startY + 3);
      }
    } else {
      this.drawMinimalLogo(leftX, startY + 3);
    }

    // Right side: Title and subtitle
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(11);
    this.setTextColorRgb(VCL_THEME.GRAY_800);
    this.doc.text("AI Readiness Assessment", rightX, startY + 4, { align: "right" });

    // Report ID or date (smaller, lighter)
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7);
    this.setTextColorRgb(VCL_THEME.GRAY_400);
    const dateText =
      this.headerInfo.date ||
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    this.doc.text(dateText, rightX, startY + 9, { align: "right" });

    // Thin separator line (very subtle)
    this.setDrawColorRgb(VCL_THEME.GRAY_200);
    this.doc.setLineWidth(0.2);
    this.doc.line(leftX, startY + 14, rightX, startY + 14);

    this.currentY = startY + 20;
  }

  private drawMinimalLogo(x: number, y: number): void {
    // Small colored dot + "VCL" text (modern, minimal)
    this.setFillColorRgb(VCL_THEME.PRIMARY_GREEN);
    this.doc.circle(x + 1.5, y, 1.5, "F");

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.setTextColorRgb(VCL_THEME.GRAY_800);
    this.doc.text("VCL", x + 5, y + 2);
  }

  /**
   * MODERN: Minimal card with subtle border
   */
  drawCard(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: {
      bgColor?: RGBColor;
      borderColor?: RGBColor;
      hasBorder?: boolean;
    },
  ): void {
    const bgColor = options?.bgColor || VCL_THEME.WHITE;
    const borderColor = options?.borderColor || VCL_THEME.GRAY_200;
    const hasBorder = options?.hasBorder !== false;

    this.setFillColorRgb(bgColor);
    this.doc.roundedRect(x, y, w, h, 3, 3, "F");

    if (hasBorder) {
      this.setDrawColorRgb(borderColor);
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(x, y, w, h, 3, 3, "S");
    }
  }

  /**
   * MODERN: Score card with thin colored left bar (like design mockups)
   */
  drawScoreCard(x: number, y: number, w: number, h: number, scorePercent: number): void {
    const scoreColors = getScoreColor(scorePercent);

    // Very light background
    this.setFillColorRgb(VCL_THEME.GRAY_50);
    this.doc.roundedRect(x, y, w, h, 3, 3, "F");

    // Thin border
    this.setDrawColorRgb(VCL_THEME.GRAY_200);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(x, y, w, h, 3, 3, "S");

    // THIN left accent bar (2mm instead of 4mm)
    this.setFillColorRgb(scoreColors.main);
    this.doc.rect(x, y + 3, 2, h - 6, "F");
  }

  /**
   * MODERN: Minimal badge (smaller, lighter)
   */
  drawBadge(text: string, x: number, y: number, style: "primary" | "success" | "muted" = "primary"): void {
    const styles = {
      primary: { bg: VCL_THEME.GREEN_TINT_10, text: VCL_THEME.PRIMARY_GREEN },
      success: { bg: VCL_THEME.SCORE_EXCELLENT_LIGHT, text: VCL_THEME.SCORE_EXCELLENT },
      muted: { bg: VCL_THEME.GRAY_100, text: VCL_THEME.GRAY_500 },
    };

    const s = styles[style];

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(7);
    const textWidth = this.doc.getTextWidth(text);
    const paddingX = 4;
    const paddingY = 1.5;
    const badgeWidth = textWidth + paddingX * 2;
    const badgeHeight = 5;

    this.setFillColorRgb(s.bg);
    this.doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, "F");

    this.setTextColorRgb(s.text);
    this.doc.text(text, x + paddingX, y + badgeHeight - paddingY);
  }

  drawScoreBadge(scorePercent: number, x: number, y: number): void {
    const scoreColors = getScoreColor(scorePercent);
    const text = scoreColors.label.toUpperCase();

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(6.5);
    const textWidth = this.doc.getTextWidth(text);
    const paddingX = 4;
    const paddingY = 1.5;
    const badgeWidth = textWidth + paddingX * 2;
    const badgeHeight = 4.5;

    this.setFillColorRgb(scoreColors.light);
    this.doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, "F");

    this.setTextColorRgb(scoreColors.main);
    this.doc.text(text, x + paddingX, y + badgeHeight - paddingY);
  }

  /**
   * MODERN: Small colored dot (like in design mockups)
   */
  drawDot(x: number, y: number, color?: RGBColor): void {
    const c = color || VCL_THEME.PRIMARY_GREEN;
    this.setFillColorRgb(c);
    this.doc.circle(x, y, 0.8, "F");
  }

  /**
   * MODERN: Checkmark (thin, minimal)
   */
  drawCheckIcon(x: number, y: number, color?: RGBColor): void {
    const c = color || VCL_THEME.PRIMARY_GREEN;
    this.setDrawColorRgb(c);
    this.doc.setLineWidth(1);
    this.doc.setLineCap("round");

    this.doc.line(x, y + 4, x + 2, y + 6);
    this.doc.line(x + 2, y + 6, x + 6, y + 2);
  }

  /**
   * MODERN: Progress bar with rounded ends and color coding
   */
  drawProgressBar(
    x: number,
    y: number,
    width: number,
    percentage: number,
    options?: {
      height?: number;
      bgColor?: RGBColor;
      fillColor?: RGBColor;
      showLabel?: boolean;
      useScoreColors?: boolean;
    },
  ): void {
    const height = options?.height || 4;
    const bgColor = options?.bgColor || VCL_THEME.GRAY_100;
    const useScoreColors = options?.useScoreColors !== false;

    let fillColor: RGBColor;
    if (options?.fillColor) {
      fillColor = options.fillColor;
    } else if (useScoreColors) {
      fillColor = getGradientColor(percentage);
    } else {
      fillColor = VCL_THEME.PRIMARY_GREEN;
    }

    // Background
    this.setFillColorRgb(bgColor);
    this.doc.roundedRect(x, y, width, height, 2, 2, "F");

    // Fill
    const fillWidth = (percentage / 100) * width;
    if (fillWidth > 1) {
      this.setFillColorRgb(fillColor);
      this.doc.roundedRect(x, y, fillWidth, height, 2, 2, "F");
    }

    if (options?.showLabel) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7);
      this.setTextColorRgb(VCL_THEME.GRAY_500);
      this.doc.text(`${Math.round(percentage)}%`, x + width + 3, y + height - 0.5);
    }
  }

  /**
   * MODERN: Large score circle (cleaner, no complex arcs)
   */
  drawScoreCircle(x: number, y: number, score: number, radius: number = 18): void {
    const scoreColors = getScoreColor(score);

    // Outer ring (light)
    this.setDrawColorRgb(VCL_THEME.GRAY_200);
    this.doc.setLineWidth(1);
    this.doc.circle(x, y, radius, "S");

    // Inner circle fill (very light tint)
    this.setFillColorRgb(scoreColors.light);
    this.doc.circle(x, y, radius - 1, "F");

    // Score text (large but not bold)
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(18);
    this.setTextColorRgb(scoreColors.main);
    const scoreText = `${Math.round(score)}`;
    const textWidth = this.doc.getTextWidth(scoreText);
    this.doc.text(scoreText, x - textWidth / 2, y + 3);

    // Small label below
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(6);
    this.setTextColorRgb(VCL_THEME.GRAY_400);
    const labelWidth = this.doc.getTextWidth("SCORE");
    this.doc.text("SCORE", x - labelWidth / 2, y + 8);
  }

  /**
   * MODERN: Section heading (lighter weight)
   */
  drawHeading(text: string, level: 1 | 2 | 3 = 2): void {
    const configs = {
      1: { size: 16, weight: "bold", gap: 8, color: VCL_THEME.GRAY_900 },
      2: { size: 11, weight: "bold", gap: 6, color: VCL_THEME.GRAY_800 },
      3: { size: 9, weight: "bold", gap: 4, color: VCL_THEME.GRAY_700 },
    };

    const cfg = configs[level];
    this.doc.setFont("helvetica", cfg.weight as "bold");
    this.doc.setFontSize(cfg.size);
    this.setTextColorRgb(cfg.color);
    this.doc.text(text, PDF_LAYOUT.MARGIN_LEFT, this.currentY);
    this.currentY += cfg.gap;
  }

  drawParagraph(
    text: string,
    options?: {
      maxWidth?: number;
      fontSize?: number;
      color?: RGBColor;
      x?: number;
      align?: "left" | "center" | "right" | "justify";
      fontWeight?: "normal" | "bold";
    },
  ): void {
    const maxWidth = options?.maxWidth || PDF_LAYOUT.CONTENT_WIDTH;
    const fontSize = options?.fontSize || 8.5;
    const color = options?.color || VCL_THEME.GRAY_600;
    const x = options?.x || PDF_LAYOUT.MARGIN_LEFT;
    const align = options?.align || "justify";
    const fontWeight = options?.fontWeight || "normal";

    this.doc.setFont("helvetica", fontWeight);
    this.doc.setFontSize(fontSize);
    this.setTextColorRgb(color);

    const lines = this.doc.splitTextToSize(text, maxWidth);
    this.doc.text(lines, x, this.currentY, { align, maxWidth });
    this.currentY += lines.length * (fontSize * 0.45) + 5;
  }

  /**
   * MODERN: Thin section divider
   */
  drawSectionDivider(): void {
    this.currentY += 6;
    this.setDrawColorRgb(VCL_THEME.GRAY_200);
    this.doc.setLineWidth(0.2);
    this.doc.line(
      PDF_LAYOUT.MARGIN_LEFT,
      this.currentY,
      PDF_LAYOUT.PAGE_WIDTH - PDF_LAYOUT.MARGIN_RIGHT,
      this.currentY,
    );
    this.currentY += 10;
  }

  checkPageBreak(neededHeight: number): boolean {
    if (this.currentY + neededHeight > PDF_LAYOUT.PAGE_HEIGHT - PDF_LAYOUT.MARGIN_BOTTOM - 15) {
      this.addNewPage();
      return true;
    }
    return false;
  }

  addNewPage(): void {
    this.doc.addPage();
    this.currentY = PDF_LAYOUT.MARGIN_TOP;
    this.drawHeader();
  }

  /**
   * MODERN: Footer like "Confidential Report • Page 01"
   */
  drawFooter(): void {
    const footerY = PDF_LAYOUT.PAGE_HEIGHT - 12;
    const currentPage = this.doc.getCurrentPageInfo().pageNumber;
    const totalPages = this.doc.getNumberOfPages();

    // Thin top line
    this.setDrawColorRgb(VCL_THEME.GRAY_200);
    this.doc.setLineWidth(0.2);
    this.doc.line(PDF_LAYOUT.MARGIN_LEFT, footerY - 4, PDF_LAYOUT.PAGE_WIDTH - PDF_LAYOUT.MARGIN_RIGHT, footerY - 4);

    // Left: Status indicator + text
    this.drawDot(PDF_LAYOUT.MARGIN_LEFT + 1, footerY);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7);
    this.setTextColorRgb(VCL_THEME.GRAY_400);
    this.doc.text("VCL AI READINESS ASSESSMENT", PDF_LAYOUT.MARGIN_LEFT + 4, footerY + 1);

    // Center: Confidential
    const centerText = "CONFIDENTIAL REPORT";
    const centerX = PDF_LAYOUT.PAGE_WIDTH / 2;
    this.doc.text(centerText, centerX, footerY + 1, { align: "center" });

    // Right: Page number
    const rightX = PDF_LAYOUT.PAGE_WIDTH - PDF_LAYOUT.MARGIN_RIGHT;
    const pageText = `PAGE ${String(currentPage).padStart(2, "0")}`;
    this.doc.text(pageText, rightX, footerY + 1, { align: "right" });
  }

  getDoc(): jsPDF {
    return this.doc;
  }
  getCurrentY(): number {
    return this.currentY;
  }
  setCurrentY(y: number): void {
    this.currentY = y;
  }
  addToY(delta: number): void {
    this.currentY += delta;
  }

  toBase64(): string {
    return this.doc.output("datauristring").split(",")[1];
  }
  toBlob(): Blob {
    return this.doc.output("blob");
  }
  toDataUri(): string {
    return this.doc.output("datauristring");
  }
}

export default PdfBuilder;
