/**
 * FAQ types for frontend
 * Mirrors the backend FAQConfig structure
 */

export interface FAQItem {
  /** Unique identifier for the FAQ */
  id: string;
  /** Keywords for matching user queries */
  keywords: string[];
  /** Question text displayed to users */
  question: string;
  /** Answer text */
  answer: string;
  /** Whether this FAQ is active */
  enabled: boolean;
}

export interface FAQConfig {
  faqs: FAQItem[];
}
