import { BLOCKED_EMAIL_DOMAINS } from "@/config/assessment";

/**
 * Validates that an email has a proper format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim().toLowerCase());
}

/**
 * Extracts the domain from an email address
 */
export function extractEmailDomain(email: string): string {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

/**
 * Checks if the email domain is a blocked consumer domain
 */
export function isBlockedEmailDomain(email: string): boolean {
  const domain = extractEmailDomain(email);
  return BLOCKED_EMAIL_DOMAINS.includes(domain);
}

/**
 * Full work email validation
 * Returns an error message if invalid, null if valid
 */
export function validateWorkEmail(email: string): string | null {
  const trimmedEmail = email.trim();
  
  if (!trimmedEmail) {
    return "Please enter your email address.";
  }
  
  if (!isValidEmailFormat(trimmedEmail)) {
    return "Please enter a valid email address.";
  }
  
  if (isBlockedEmailDomain(trimmedEmail)) {
    return "Please use your work email address. Consumer email providers such as Gmail or Hotmail are not accepted.";
  }
  
  return null;
}

/**
 * Validates a website URL or domain
 * Returns an error message if invalid, null if valid
 */
export function validateWebsite(website: string): string | null {
  const trimmed = website.trim();
  
  if (!trimmed) {
    return "Please enter your company website.";
  }
  
  // Check for spaces
  if (/\s/.test(trimmed)) {
    return "Website should not contain spaces.";
  }
  
  // Check for at least one dot
  if (!trimmed.includes(".")) {
    return "Please enter a valid website (e.g., examplecorp.com).";
  }
  
  return null;
}

/**
 * Normalizes a website URL to a clean domain
 * - Removes http:// or https://
 * - Removes www.
 * - Takes everything up to the first /
 * - Converts to lowercase
 */
export function normalizeWebsiteDomain(website: string): string {
  let domain = website.trim().toLowerCase();
  
  // Remove protocol
  domain = domain.replace(/^https?:\/\//, "");
  
  // Remove www.
  domain = domain.replace(/^www\./, "");
  
  // Take everything up to the first /
  const slashIndex = domain.indexOf("/");
  if (slashIndex !== -1) {
    domain = domain.substring(0, slashIndex);
  }
  
  return domain;
}

/**
 * Validates a WhatsApp phone number
 * - Must start with +
 * - Contains digits and optional spaces
 */
export function validateWhatsAppNumber(phone: string): string | null {
  const trimmed = phone.trim();
  
  if (!trimmed) {
    return "Please enter your WhatsApp number.";
  }
  
  if (!trimmed.startsWith("+")) {
    return "Please include your country code (e.g., +971 50 123 4567).";
  }
  
  // Remove spaces and check if remaining chars are digits (except the leading +)
  const digitsOnly = trimmed.substring(1).replace(/\s/g, "");
  if (!/^\d+$/.test(digitsOnly)) {
    return "Please enter a valid phone number with only digits.";
  }
  
  if (digitsOnly.length < 7) {
    return "Phone number seems too short. Please check and try again.";
  }
  
  return null;
}
