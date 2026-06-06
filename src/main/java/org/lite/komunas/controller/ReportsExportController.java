package org.lite.komunas.controller;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/reports")
public class ReportsExportController {

    public record ExportPDFRequest(
            int totalMonitored,
            int syncRate,
            int pendingUpdates,
            int activeTracking,
            List<ReportItem> items
    ) {}

    public record ReportItem(
            String id,
            String name,
            String category,
            String status,
            String version,
            String lastChecked,
            String detail
    ) {}

    @PostMapping("/export-pdf")
    public ResponseEntity<byte[]> exportPDF(@RequestBody ExportPDFRequest request) {
        log.info("Generating reports PDF for {} items", request.items().size());

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            java.awt.Color primaryColor = new java.awt.Color(90, 122, 0); // Accent #5a7a00
            java.awt.Color darkColor = new java.awt.Color(30, 41, 59); // Slate-800
            java.awt.Color grayColor = new java.awt.Color(100, 116, 139); // Slate-500
            java.awt.Color lightBg = new java.awt.Color(248, 250, 252); // Slate-50

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, darkColor);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, grayColor);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkColor);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, darkColor);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Element.ALIGN_CENTER, java.awt.Color.WHITE);
            Font statValFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, primaryColor);
            Font statLblFont = FontFactory.getFont(FontFactory.HELVETICA, 8, grayColor);

            // Title
            Paragraph title = new Paragraph("Komunas Compliance Report", titleFont);
            title.setSpacingAfter(4);
            document.add(title);

            // Subtitle / Date
            String generatedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            Paragraph subtitle = new Paragraph("Generated on: " + generatedTime + " | Regulatory Sync Intelligence", subtitleFont);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // KPIs Grid/Table (4 columns)
            PdfPTable kpiTable = new PdfPTable(4);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(20);

            kpiTable.addCell(createKpiCell("TOTAL MONITORED", String.valueOf(request.totalMonitored()), statLblFont, statValFont, lightBg));
            kpiTable.addCell(createKpiCell("SYNC RATE", request.syncRate() + "%", statLblFont, statValFont, lightBg));
            kpiTable.addCell(createKpiCell("PENDING UPDATES", String.valueOf(request.pendingUpdates()), statLblFont, statValFont, lightBg));
            kpiTable.addCell(createKpiCell("ACTIVE SYNCING", String.valueOf(request.activeTracking()), statLblFont, statValFont, lightBg));
            document.add(kpiTable);

            // Table Title
            Paragraph tableTitle = new Paragraph("Monitored Sources & Synchronization State", sectionFont);
            tableTitle.setSpacingAfter(10);
            document.add(tableTitle);

            // Main Data Table
            PdfPTable table = new PdfPTable(new float[]{30, 20, 15, 15, 20});
            table.setWidthPercentage(100);
            table.setHeaderRows(1);

            // Headers
            String[] headers = {"Resource Name", "Category", "Status", "Version", "Last Checked"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(header, headerFont));
                cell.setBackgroundColor(darkColor);
                cell.setPadding(8);
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                table.addCell(cell);
            }

            // Data Rows
            for (ReportItem item : request.items()) {
                // Name & Detail cell
                Paragraph namePara = new Paragraph(item.name(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, darkColor));
                namePara.setLeading(12f);
                if (item.detail() != null && !item.detail().isEmpty()) {
                    namePara.add(new Chunk("\n" + item.detail(), FontFactory.getFont(FontFactory.HELVETICA, 7, grayColor)));
                }
                PdfPCell nameCell = new PdfPCell(namePara);
                nameCell.setPadding(8);
                table.addCell(nameCell);

                // Category
                PdfPCell catCell = new PdfPCell(new Paragraph(item.category(), bodyFont));
                catCell.setPadding(8);
                table.addCell(catCell);

                // Status
                PdfPCell statusCell = new PdfPCell(new Paragraph(item.status(), bodyFont));
                statusCell.setPadding(8);
                table.addCell(statusCell);

                // Version
                PdfPCell verCell = new PdfPCell(new Paragraph(item.version(), bodyFont));
                verCell.setPadding(8);
                table.addCell(verCell);

                // Last Checked
                Paragraph datePara = new Paragraph(item.lastChecked() != null ? item.lastChecked() : "N/A", bodyFont);
                datePara.setLeading(14f);
                PdfPCell dateCell = new PdfPCell(datePara);
                dateCell.setPadding(8);
                table.addCell(dateCell);
            }

            document.add(table);
            document.close();

            byte[] pdfBytes = out.toByteArray();
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_PDF);
            httpHeaders.setContentDispositionFormData("attachment", "Komunas_Compliance_Report_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf");
            httpHeaders.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, httpHeaders, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to generate compliance report PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/export-csv")
    public ResponseEntity<byte[]> exportCSV(@RequestBody ExportPDFRequest request) {
        log.info("Generating reports CSV for {} items", request.items().size());

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            StringBuilder sb = new StringBuilder();

            // Add metadata / metrics headers
            sb.append("\"KPI Summary\"\n");
            sb.append(String.format("\"TOTAL MONITORED\",\"%d\"\n", request.totalMonitored()));
            sb.append(String.format("\"SYNC RATE\",\"%d%%\"\n", request.syncRate()));
            sb.append(String.format("\"PENDING UPDATES\",\"%d\"\n", request.pendingUpdates()));
            sb.append(String.format("\"ACTIVE SYNCING\",\"%d\"\n\n\n", request.activeTracking()));

            // Add main table headers
            sb.append("\"Resource Name\",\"Details\",\"Category\",\"Status\",\"Version\",\"Last Checked\"\n");

            // Add rows
            for (ReportItem item : request.items()) {
                sb.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        escapeCsv(item.name()),
                        escapeCsv(item.detail() != null ? item.detail() : ""),
                        escapeCsv(item.category()),
                        escapeCsv(item.status()),
                        escapeCsv(item.version()),
                        escapeCsv(item.lastChecked() != null ? item.lastChecked() : "N/A")));
            }

            byte[] csvBytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8));
            httpHeaders.setContentDispositionFormData("attachment", "Komunas_Compliance_Report_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".csv");
            httpHeaders.setContentLength(csvBytes.length);

            return new ResponseEntity<>(csvBytes, httpHeaders, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to generate compliance report CSV", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String escapeCsv(String value) {
        return value.replace("\"", "\"\"");
    }

    private PdfPCell createKpiCell(String label, String value, Font lblFont, Font valFont, java.awt.Color bg) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setPadding(10);
        cell.setBorderColor(new java.awt.Color(226, 232, 240)); // Slate-200

        Paragraph p = new Paragraph(label, lblFont);
        p.setSpacingAfter(4);
        cell.addElement(p);

        Paragraph val = new Paragraph(value, valFont);
        cell.addElement(val);

        return cell;
    }
}
