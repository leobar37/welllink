import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { RecommendationsPDF } from "./pdf-document";
import type { ClientRecommendations } from "../schema";

interface ExportPdfOptions {
  data: ClientRecommendations;
  clientName: string;
  advisorName?: string;
  date?: string;
}

export async function exportRecommendationsToPdf({
  data,
  clientName,
  advisorName,
  date = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }),
}: ExportPdfOptions): Promise<void> {
  // Create the PDF document element
  const doc = createElement(RecommendationsPDF, {
    data,
    clientName,
    advisorName,
    date,
  });

  // Generate the PDF blob
  const blob = await pdf(doc).toBlob();

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reto-7-dias-${clientName.toLowerCase().replace(/\s+/g, "-")}-${date.replace(/\//g, "-")}.pdf`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
