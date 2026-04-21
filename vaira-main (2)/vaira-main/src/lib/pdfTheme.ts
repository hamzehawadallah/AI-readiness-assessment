/**
 * VCL Brand Theme for PDF Generation - MODERN DESIGN VERSION
 * Inspired by minimalist HTML designs with green accent (#13ec5b)
 * All colors are solid RGB values - NO TRANSPARENCY/ALPHA
 * Compatible with jsPDF v3.0.4
 */

// Modern Design Colors - Green Accent Theme
export const VCL_THEME = {
  // PRIMARY: Bright green (from design mockups)
  PRIMARY_GREEN: { r: 19, g: 236, b: 91 }, // #13ec5b - Main brand color
  PRIMARY_GREEN_HEX: "#13ec5b",

  // Green tints for backgrounds and accents
  GREEN_TINT_05: { r: 244, g: 254, b: 247 }, // Very light green bg
  GREEN_TINT_10: { r: 233, g: 253, b: 239 }, // Light green panels
  GREEN_TINT_20: { r: 209, g: 250, b: 223 }, // Medium green highlights

  // Neutral grays (Apple-inspired)
  GRAY_50: { r: 250, g: 250, b: 250 }, // Almost white
  GRAY_100: { r: 245, g: 245, b: 247 }, // Background light
  GRAY_200: { r: 229, g: 231, b: 235 }, // Border light
  GRAY_300: { r: 203, g: 213, b: 225 }, // Border medium
  GRAY_400: { r: 156, g: 163, b: 175 }, // Text muted
  GRAY_500: { r: 107, g: 114, b: 128 }, // Text secondary
  GRAY_600: { r: 75, g: 85, b: 99 }, // Text primary
  GRAY_700: { r: 55, g: 65, b: 81 }, // Text dark
  GRAY_800: { r: 31, g: 41, b: 55 }, // Heading dark
  GRAY_900: { r: 15, g: 23, b: 42 }, // Almost black

  // Score-based colors (refined for modern look)
  SCORE_EXCELLENT: { r: 19, g: 236, b: 91 }, // 81-100% Bright green
  SCORE_EXCELLENT_LIGHT: { r: 233, g: 253, b: 239 },

  SCORE_GOOD: { r: 132, g: 204, b: 22 }, // 61-80% Lime
  SCORE_GOOD_LIGHT: { r: 236, g: 252, b: 203 },

  SCORE_DEVELOPING: { r: 245, g: 158, b: 11 }, // 41-60% Amber
  SCORE_DEVELOPING_LIGHT: { r: 254, g: 243, b: 199 },

  SCORE_EMERGING: { r: 239, g: 68, b: 68 }, // 21-40% Orange-red
  SCORE_EMERGING_LIGHT: { r: 254, g: 226, b: 226 },

  SCORE_BEGINNING: { r: 220, g: 38, b: 38 }, // 0-20% Red
  SCORE_BEGINNING_LIGHT: { r: 254, g: 226, b: 226 },

  // Special colors
  WHITE: { r: 255, g: 255, b: 255 },
  BLACK: { r: 0, g: 0, b: 0 },

  // VCL brand color (keep as optional alternative)
  VCL_RED: { r: 206, g: 40, b: 35 },
  VCL_RED_TINT_10: { r: 253, g: 237, b: 237 },
} as const;

// Modern PDF Layout - More whitespace, cleaner
export const PDF_LAYOUT = {
  PAGE_WIDTH: 210,
  PAGE_HEIGHT: 297,
  MARGIN_LEFT: 20, // Wider margins for modern look
  MARGIN_RIGHT: 20,
  MARGIN_TOP: 25, // More top space
  MARGIN_BOTTOM: 20,
  CONTENT_WIDTH: 170, // 210 - 20 - 20
  LINE_HEIGHT: 7, // More generous line spacing
  SECTION_GAP: 16, // Larger gaps between sections
  CARD_PADDING: 12, // More padding
  CARD_RADIUS: 3, // Slightly larger radius
} as const;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export type RGBColor = { r: number; g: number; b: number };

/**
 * Get color based on score percentage
 */
export function getScoreColor(scorePercent: number): {
  main: RGBColor;
  light: RGBColor;
  label: string;
} {
  if (scorePercent >= 81) {
    return {
      main: VCL_THEME.SCORE_EXCELLENT,
      light: VCL_THEME.SCORE_EXCELLENT_LIGHT,
      label: "Excellent",
    };
  } else if (scorePercent >= 61) {
    return {
      main: VCL_THEME.SCORE_GOOD,
      light: VCL_THEME.SCORE_GOOD_LIGHT,
      label: "Good",
    };
  } else if (scorePercent >= 41) {
    return {
      main: VCL_THEME.SCORE_DEVELOPING,
      light: VCL_THEME.SCORE_DEVELOPING_LIGHT,
      label: "Developing",
    };
  } else if (scorePercent >= 21) {
    return {
      main: VCL_THEME.SCORE_EMERGING,
      light: VCL_THEME.SCORE_EMERGING_LIGHT,
      label: "Emerging",
    };
  } else {
    return {
      main: VCL_THEME.SCORE_BEGINNING,
      light: VCL_THEME.SCORE_BEGINNING_LIGHT,
      label: "Beginning",
    };
  }
}

export function interpolateColor(color1: RGBColor, color2: RGBColor, percentage: number): RGBColor {
  const p = Math.max(0, Math.min(1, percentage / 100));
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * p),
    g: Math.round(color1.g + (color2.g - color1.g) * p),
    b: Math.round(color1.b + (color2.b - color1.b) * p),
  };
}

export function getGradientColor(scorePercent: number): RGBColor {
  const score = Math.max(0, Math.min(100, scorePercent));

  if (score >= 80) {
    return interpolateColor(VCL_THEME.SCORE_GOOD, VCL_THEME.SCORE_EXCELLENT, (score - 80) * 5);
  } else if (score >= 60) {
    return interpolateColor(VCL_THEME.SCORE_DEVELOPING, VCL_THEME.SCORE_GOOD, (score - 60) * 5);
  } else if (score >= 40) {
    return interpolateColor(VCL_THEME.SCORE_EMERGING, VCL_THEME.SCORE_DEVELOPING, (score - 40) * 5);
  } else if (score >= 20) {
    return interpolateColor(VCL_THEME.SCORE_BEGINNING, VCL_THEME.SCORE_EMERGING, (score - 20) * 5);
  } else {
    return VCL_THEME.SCORE_BEGINNING;
  }
}
