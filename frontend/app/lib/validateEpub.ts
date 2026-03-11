/**
 * EPUB validation result types and grouping logic.
 * Actual validation is run via @likecoin/epubcheck-ts in the API route only.
 */

export type ValidationStatus = "ok" | "warning" | "error";

export interface ValidationMessage {
  id: string;
  severity: "fatal" | "error" | "warning" | "info" | "usage";
  message: string;
  location?: string;
  suggestion?: string;
}

export interface EpubValidationResult {
  status: ValidationStatus;
  epubVersion: string | null;
  metadataErrors: ValidationMessage[];
  cssWarnings: ValidationMessage[];
  navigationIssues: ValidationMessage[];
  otherMessages: ValidationMessage[];
  suggestions: string[];
}

/** Raw message shape from @likecoin/epubcheck-ts result.messages */
export interface RawValidationMessage {
  id: string;
  severity: string;
  message: string;
  location?: { path?: string; line?: number };
  suggestion?: string;
}

export interface RawEpubCheckResult {
  messages: RawValidationMessage[];
  version?: string;
  fatalCount: number;
  errorCount: number;
  warningCount: number;
}

const LANGUAGE_IDS = ["OPF-012", "OPF-013", "OPF-014"];

function toValidationMessage(m: RawValidationMessage): ValidationMessage {
  const location = m.location
    ? [m.location.path, m.location.line != null ? `:${m.location.line}` : ""].filter(Boolean).join("")
    : undefined;
  return {
    id: m.id,
    severity: m.severity as ValidationMessage["severity"],
    message: m.message,
    location,
    suggestion: m.suggestion,
  };
}

function suggestFix(id: string, message: string): string | null {
  const lower = message.toLowerCase();
  if (LANGUAGE_IDS.includes(id) || lower.includes("language") || lower.includes("dc:language")) {
    return "Add language metadata in conversion settings (e.g. Language field).";
  }
  if (lower.includes("title") || lower.includes("dc:title")) {
    return "Add title metadata in conversion settings.";
  }
  if (lower.includes("identifier") || lower.includes("dc:identifier")) {
    return "Add a unique identifier in conversion settings.";
  }
  if (id.startsWith("CSS-")) {
    return "Check your source document styles or use simpler CSS in conversion.";
  }
  if (id.startsWith("NAV-") || id.startsWith("NCX-")) {
    return "Use Heading 1/2/3 in your document to generate a proper table of contents.";
  }
  return null;
}

/** Build our result from raw epubcheck result. Used by API route only. */
export function buildValidationResult(result: RawEpubCheckResult): EpubValidationResult {
  const metadataErrors: ValidationMessage[] = [];
  const cssWarnings: ValidationMessage[] = [];
  const navigationIssues: ValidationMessage[] = [];
  const otherMessages: ValidationMessage[] = [];
  const suggestionSet = new Set<string>();

  for (const m of result.messages) {
    const msg = toValidationMessage(m);
    const suggestion = m.suggestion || suggestFix(m.id, m.message);
    if (suggestion) suggestionSet.add(suggestion);

    if (m.id.startsWith("CSS-")) {
      cssWarnings.push(msg);
    } else if (m.id.startsWith("NAV-") || m.id.startsWith("NCX-")) {
      navigationIssues.push(msg);
    } else if (m.id.startsWith("OPF-") || m.id.startsWith("PKG-")) {
      if (m.severity === "error" || m.severity === "fatal") metadataErrors.push(msg);
      else otherMessages.push(msg);
    } else {
      otherMessages.push(msg);
    }
  }

  let status: ValidationStatus = "ok";
  if (result.fatalCount > 0 || result.errorCount > 0) status = "error";
  else if (result.warningCount > 0) status = "warning";

  return {
    status,
    epubVersion: result.version ?? null,
    metadataErrors,
    cssWarnings,
    navigationIssues,
    otherMessages,
    suggestions: Array.from(suggestionSet),
  };
}
