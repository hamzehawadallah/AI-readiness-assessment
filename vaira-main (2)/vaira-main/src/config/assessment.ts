/**
 * VCL AI Readiness Assessment Configuration
 *
 * This file contains all configurable elements of the assessment.
 * Edit question text, dimension labels, and other content here.
 */

// ============================================
// WEBHOOK CONFIGURATION
// Change this URL to point to your n8n workflow
// ============================================
export const WEBHOOK_URL = "/api/analyze.php";

// ============================================
// DELIVERY WEBHOOK CONFIGURATION
// Webhook for sending PDF reports via email/WhatsApp
// ============================================
export const DELIVERY_WEBHOOK_URL = "/api/send-email.php";

// ============================================
// EMAIL VALIDATION
// Add or remove domains from this blacklist
// ============================================
export const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "yandex.com",
  "zoho.com",
];

// ============================================
// VCL CONTACT INFORMATION
// Update with your actual booking/contact link
// ============================================
export const VCL_CONTACT = {
  // TODO: Replace with actual Calendly or booking link
  bookingUrl: "https://outlook.office.com/book/VCLDigitalIntroMeeting@ttmassociates.com/?ismsaljsauthenabled",
  email: "info@vcl.solutions",
};

// ============================================
// LIKERT SCALE LABELS
// ============================================
export const LIKERT_SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
] as const;

// ============================================
// COMPANY SIZE OPTIONS
// ============================================
export const COMPANY_SIZE_OPTIONS = [
  { value: "1-49", label: "1 to 49 employees" },
  { value: "50-249", label: "50 to 249 employees" },
  { value: "250-999", label: "250 to 999 employees" },
  { value: "1000+", label: "1,000+ employees" },
] as const;

// ============================================
// COUNTRY OPTIONS
// ============================================
export const COUNTRY_OPTIONS = [
  { value: "united-kingdom", label: "United Kingdom" },
  { value: "united-states", label: "United States" },
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "netherlands", label: "Netherlands" },
  { value: "australia", label: "Australia" },
  { value: "canada", label: "Canada" },
  { value: "singapore", label: "Singapore" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "other", label: "Other" },
] as const;

// ============================================
// ASSESSMENT DIMENSIONS AND QUESTIONS
// ============================================
export interface AssessmentQuestion {
  id: string;
  text: string;
}

export interface AssessmentDimension {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  questions: AssessmentQuestion[];
}

export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  {
    id: "strategyGovernance",
    title: "Strategy and Governance",
    shortTitle: "Strategy",
    description: "How well AI is embedded in your organisational vision and leadership approach.",
    questions: [
      {
        id: "sg1",
        text: "Our organization has a clear, documented AI vision that links directly to business and operational priorities.",
      },
      {
        id: "sg2",
        text: "There is an agreed governance model for AI that covers ownership, policies, and decision rights.",
      },
      {
        id: "sg3",
        text: "Leadership regularly reviews AI initiatives and their impact on performance, risk, and ROI.",
      },
    ],
  },
  {
    id: "useCasesValue",
    title: "Use Cases and Value",
    shortTitle: "Use Cases",
    description: "Your ability to identify, prioritise, and scale AI initiatives that deliver measurable outcomes.",
    questions: [
      {
        id: "uv1",
        text: "We have identified and prioritised a portfolio of AI use cases with clear business outcomes.",
      },
      {
        id: "uv2",
        text: "There is a structured process to move AI ideas from concept to pilot to scaled implementation.",
      },
      {
        id: "uv3",
        text: "We track the value and performance of AI use cases beyond technical metrics, focusing on business KPIs.",
      },
    ],
  },
  {
    id: "peopleSkills",
    title: "People and Skills",
    shortTitle: "People",
    description: "How prepared your workforce is to understand, adopt, and leverage AI capabilities.",
    questions: [
      {
        id: "ps1",
        text: "Non-technical staff are aware of AI possibilities and how AI can support their day-to-day work.",
      },
      {
        id: "ps2",
        text: "Managers and leaders are equipped to redesign work and roles to leverage AI capabilities.",
      },
      {
        id: "ps3",
        text: "We have role-based AI learning paths and programmes for different levels (staff, managers, leaders).",
      },
    ],
  },
  {
    id: "dataTechWaysOfWorking",
    title: "Data, Technology and Ways of Working",
    shortTitle: "Data & Tech",
    description: "Your foundational readiness in data quality, tooling, and agile experimentation.",
    questions: [
      {
        id: "dt1",
        text: "Our data is accessible, reasonably clean, and usable for AI initiatives.",
      },
      {
        id: "dt2",
        text: "We have access to the tools and platforms needed to prototype and deploy AI solutions securely.",
      },
      {
        id: "dt3",
        text: "Teams adopt agile and experimental ways of working, allowing rapid testing and improvement of AI ideas.",
      },
    ],
  },
];

// ============================================
// LANDING PAGE CONTENT
// ============================================
export const LANDING_CONTENT = {
  title: "AI READINESS ASSESSMENT",
  subtitle: "Understand how you personally engage with AI, and what it means for your role, decisions, and impact",
  description: [
    "This short diagnostic evaluates how individuals understand, adopt, and apply AI in their day-to-day work. It focuses on judgement, behaviour, and real-world application across digital, behavioural, functional, and creative dimensions, and highlights gaps between awareness and execution.",
  ],
  features: [
    "Takes about 5 minutes",
    "Designed for professionals navigating the AI era",
    "Receive actionable insights immediately",
    "Tailored recommendations for you & your organisation",
  ],
  cta: "Start your AI readiness check",
};
