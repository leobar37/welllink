import { ReportRepository, type ReportFilters, type InventoryRotationItem, type StockValuationItem, type TopConsumedItem } from "../repository/report";

export interface InventoryRotationReport {
  items: InventoryRotationItem[];
  summary: {
    totalProducts: number;
    averageRotationRate: number;
    totalConsumed: number;
    totalPurchased: number;
  };
  filters: ReportFilters;
}

export interface StockValuationReport {
  totalValue: number;
  totalItems: number;
  byCategory: StockValuationItem[];
  filters: ReportFilters;
}

export interface TopConsumedReport {
  items: TopConsumedItem[];
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
  };
  filters: ReportFilters;
}

export interface ExportOptions {
  format: "xlsx" | "pdf";
  title?: string;
}

export class ReportService {
  constructor(
    private reportRepository: ReportRepository,
  ) {}

  /**
   * Get inventory rotation report
   */
  async getInventoryRotation(
    profileId: string,
    filters?: ReportFilters
  ): Promise<InventoryRotationReport> {
    const items = await this.reportRepository.getInventoryRotation(profileId, filters);

    const totalProducts = items.length;
    const averageRotationRate = totalProducts > 0
      ? items.reduce((sum, item) => sum + item.rotationRate, 0) / totalProducts
      : 0;
    const totalConsumed = items.reduce((sum, item) => sum + item.totalConsumed, 0);
    const totalPurchased = items.reduce((sum, item) => sum + item.totalPurchased, 0);

    return {
      items,
      summary: {
        totalProducts,
        averageRotationRate: Number(averageRotationRate.toFixed(2)),
        totalConsumed,
        totalPurchased,
      },
      filters: filters || {},
    };
  }

  /**
   * Get stock valuation report
   */
  async getStockValuation(
    profileId: string,
    filters?: ReportFilters
  ): Promise<StockValuationReport> {
    const result = await this.reportRepository.getStockValuation(profileId, filters);

    return {
      totalValue: result.totalValue,
      totalItems: result.totalItems,
      byCategory: result.byCategory,
      filters: filters || {},
    };
  }

  /**
   * Get top consumed products report
   */
  async getTopConsumedProducts(
    profileId: string,
    filters?: ReportFilters,
    limit: number = 10
  ): Promise<TopConsumedReport> {
    const items = await this.reportRepository.getTopConsumedProducts(profileId, filters, limit);

    const totalProducts = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);

    return {
      items,
      summary: {
        totalProducts,
        totalQuantity,
        totalValue,
      },
      filters: filters || {},
    };
  }

  /**
   * Generate Excel export for a report
   */
  async exportToExcel(
    reportType: "rotation" | "valuation" | "consumed",
    profileId: string,
    filters?: ReportFilters,
    options?: { title?: string }
  ): Promise<Buffer> {
    const XLSX = await import("xlsx") as typeof import("xlsx");

    const workbook = XLSX.utils.book_new();

    let worksheet: ReturnType<typeof XLSX.utils.json_to_sheet>;
    let sheetName: string;

    switch (reportType) {
      case "rotation": {
        const report = await this.getInventoryRotation(profileId, filters);
        const data = report.items.map((item) => ({
          "ID Producto": item.productId,
          "Nombre": item.productName,
          "SKU": item.productSku,
          "Categoría": item.categoryName || "Sin categoría",
          "Total Consumido": item.totalConsumed,
          "Total Comprado": item.totalPurchased,
          "Inventario Promedio": item.averageInventory,
          "Tasa de Rotación": item.rotationRate,
          "Costo Unitario": item.cost,
        }));
        worksheet = XLSX.utils.json_to_sheet(data);
        sheetName = "Rotación de Inventario";
        break;
      }
      case "valuation": {
        const report = await this.getStockValuation(profileId, filters);
        const categoryData = report.byCategory.map((cat) => ({
          "ID Categoría": cat.categoryId || "",
          "Categoría": cat.categoryName || "Sin categoría",
          "Productos": cat.productCount,
          "Cantidad Total": cat.totalQuantity,
          "Valor Total": cat.totalValue,
        }));
        // Add total row
        categoryData.push({
          "ID Categoría": "",
          "Categoría": "TOTAL",
          "Productos": report.byCategory.reduce((sum, c) => sum + c.productCount, 0),
          "Cantidad Total": report.totalItems,
          "Valor Total": report.totalValue,
        });
        worksheet = XLSX.utils.json_to_sheet(categoryData);
        sheetName = "Valoración de Stock";
        break;
      }
      case "consumed": {
        const report = await this.getTopConsumedProducts(profileId, filters);
        const data = report.items.map((item) => ({
          "ID Producto": item.productId,
          "Nombre": item.productName,
          "SKU": item.productSku,
          "Categoría": item.categoryName || "Sin categoría",
          "Cantidad Consumida": item.totalQuantity,
          "Valor Consumido": item.totalValue,
        }));
        worksheet = XLSX.utils.json_to_sheet(data);
        sheetName = "Productos Más Consumidos";
        break;
      }
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return Buffer.from(buffer);
  }

  /**
   * Generate PDF export for a report
   */
  async exportToPdf(
    reportType: "rotation" | "valuation" | "consumed",
    profileId: string,
    filters?: ReportFilters,
    options?: { title?: string }
  ): Promise<Buffer> {
    const PDFDocument = (await import("pdfkit")).default;

    // Get the data first
    let rotationData: InventoryRotationReport | null = null;
    let valuationData: StockValuationReport | null = null;
    let consumedData: TopConsumedReport | null = null;

    if (reportType === "rotation") {
      rotationData = await this.getInventoryRotation(profileId, filters);
    } else if (reportType === "valuation") {
      valuationData = await this.getStockValuation(profileId, filters);
    } else if (reportType === "consumed") {
      consumedData = await this.getTopConsumedProducts(profileId, filters);
    }

    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50 });

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Title
        const title = options?.title || getReportTitle(reportType);
        doc.fontSize(18).text(title, { align: "center" });
        doc.moveDown();

        // Date range
        if (filters?.startDate || filters?.endDate) {
          let dateRange = "Período: ";
          if (filters.startDate) {
            dateRange += filters.startDate.toLocaleDateString("es-ES");
          }
          if (filters.endDate) {
            dateRange += " - " + filters.endDate.toLocaleDateString("es-ES");
          }
          doc.fontSize(10).text(dateRange, { align: "center" });
          doc.moveDown(2);
        } else {
          doc.fontSize(10).text("Período: Todos", { align: "center" });
          doc.moveDown(2);
        }

        doc.fontSize(12);

        switch (reportType) {
          case "rotation": {
            const report = rotationData!;
            
            // Summary
            doc.fontSize(12).text("Resumen", { underline: true });
            doc.fontSize(10);
            doc.text(`Total de productos: ${report.summary.totalProducts}`);
            doc.text(`Tasa de rotación promedio: ${report.summary.averageRotationRate}`);
            doc.text(`Total consumido: ${report.summary.totalConsumed}`);
            doc.text(`Total comprado: ${report.summary.totalPurchased}`);
            doc.moveDown();

            // Items
            doc.fontSize(12).text("Detalle de Productos", { underline: true });
            doc.fontSize(9);

            const tableTop = doc.y;
            const colWidths = [80, 60, 40, 40, 50];
            const headers = ["Producto", "SKU", "Categoría", "Consumido", "Rotación"];

            // Draw header
            doc.font("Helvetica-Bold");
            let xPos = 50;
            headers.forEach((header, i) => {
              doc.text(header, xPos, tableTop, { width: colWidths[i] });
              xPos += colWidths[i];
            });
            doc.moveDown();

            // Draw rows
            doc.font("Helvetica");
            report.items.slice(0, 20).forEach((item) => {
              if (doc.y > 700) {
                doc.addPage();
              }
              xPos = 50;
              doc.text(item.productName.substring(0, 25), xPos, doc.y, { width: colWidths[0] });
              xPos += colWidths[0];
              doc.text(item.productSku, xPos, doc.y, { width: colWidths[1] });
              xPos += colWidths[1];
              doc.text((item.categoryName || "-").substring(0, 15), xPos, doc.y, { width: colWidths[2] });
              xPos += colWidths[2];
              doc.text(item.totalConsumed.toString(), xPos, doc.y, { width: colWidths[3] });
              xPos += colWidths[3];
              doc.text(item.rotationRate.toString(), xPos, doc.y, { width: colWidths[4] });
              doc.moveDown(0.5);
            });
            break;
          }
          case "valuation": {
            const report = valuationData!;

            // Summary
            doc.fontSize(12).text("Resumen", { underline: true });
            doc.fontSize(10);
            doc.text(`Valor total del inventario: $${report.totalValue.toFixed(2)}`);
            doc.text(`Total de unidades: ${report.totalItems}`);
            doc.moveDown();

            // By category
            doc.fontSize(12).text("Por Categoría", { underline: true });
            doc.fontSize(9);

            const catTableTop = doc.y;
            const catColWidths = [150, 50, 80, 80];
            const catHeaders = ["Categoría", "Productos", "Cantidad", "Valor"];

            doc.font("Helvetica-Bold");
            let xCat = 50;
            catHeaders.forEach((header, i) => {
              doc.text(header, xCat, catTableTop, { width: catColWidths[i] });
              xCat += catColWidths[i];
            });
            doc.moveDown();

            doc.font("Helvetica");
            report.byCategory.forEach((cat) => {
              if (doc.y > 700) {
                doc.addPage();
              }
              xCat = 50;
              doc.text(cat.categoryName || "-", xCat, doc.y, { width: catColWidths[0] });
              xCat += catColWidths[0];
              doc.text(cat.productCount.toString(), xCat, doc.y, { width: catColWidths[1] });
              xCat += catColWidths[1];
              doc.text(cat.totalQuantity.toString(), xCat, doc.y, { width: catColWidths[2] });
              xCat += catColWidths[2];
              doc.text(`$${cat.totalValue.toFixed(2)}`, xCat, doc.y, { width: catColWidths[3] });
              doc.moveDown(0.5);
            });
            break;
          }
          case "consumed": {
            const report = consumedData!;

            // Summary
            doc.fontSize(12).text("Resumen", { underline: true });
            doc.fontSize(10);
            doc.text(`Total de productos: ${report.summary.totalProducts}`);
            doc.text(`Cantidad total consumida: ${report.summary.totalQuantity}`);
            doc.text(`Valor total consumido: $${report.summary.totalValue.toFixed(2)}`);
            doc.moveDown();

            // Items
            doc.fontSize(12).text("Productos Más Consumidos", { underline: true });
            doc.fontSize(9);

            const consumedTableTop = doc.y;
            const consumedColWidths = [80, 60, 40, 50, 60];
            const consumedHeaders = ["Producto", "SKU", "Categoría", "Cantidad", "Valor"];

            doc.font("Helvetica-Bold");
            let xConsumed = 50;
            consumedHeaders.forEach((header, i) => {
              doc.text(header, xConsumed, consumedTableTop, { width: consumedColWidths[i] });
              xConsumed += consumedColWidths[i];
            });
            doc.moveDown();

            doc.font("Helvetica");
            report.items.forEach((item) => {
              if (doc.y > 700) {
                doc.addPage();
              }
              xConsumed = 50;
              doc.text(item.productName.substring(0, 25), xConsumed, doc.y, { width: consumedColWidths[0] });
              xConsumed += consumedColWidths[0];
              doc.text(item.productSku, xConsumed, doc.y, { width: consumedColWidths[1] });
              xConsumed += consumedColWidths[1];
              doc.text((item.categoryName || "-").substring(0, 15), xConsumed, doc.y, { width: consumedColWidths[2] });
              xConsumed += consumedColWidths[2];
              doc.text(item.totalQuantity.toString(), xConsumed, doc.y, { width: consumedColWidths[3] });
              xConsumed += consumedColWidths[3];
              doc.text(`$${item.totalValue.toFixed(2)}`, xConsumed, doc.y, { width: consumedColWidths[4] });
              doc.moveDown(0.5);
            });
            break;
          }
        }

        // Footer
        doc.fontSize(8);
        doc.text(
          `Generado el ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}`,
          50,
          doc.page.height - 50,
          { align: "center" }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

function getReportTitle(reportType: string): string {
  switch (reportType) {
    case "rotation":
      return "Reporte de Rotación de Inventario";
    case "valuation":
      return "Reporte de Valoración de Stock";
    case "consumed":
      return "Reporte de Productos Más Consumidos";
    default:
      return "Reporte de Inventario";
  }
}
