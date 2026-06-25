package com.rentspace.domain.contract;

import com.lowagie.text.DocumentException;
import com.rentspace.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractTemplateService {

    private final TemplateEngine templateEngine;

    private static final DateTimeFormatter VN_DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", new Locale("vi", "VN"))
                    .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    /**
     * Tạo snapshot nội dung hợp đồng dạng JSON-string.
     * Được lưu vào contracts.content_snapshot để render lại sau.
     */
    public String buildContentSnapshot(Map<String, Object> variables) {
        Context ctx = new Context(new Locale("vi", "VN"));
        ctx.setVariables(variables);
        return templateEngine.process("contracts/rental-agreement", ctx);
    }

    /**
     * Render HTML → PDF byte[].
     * Nhận vào content_snapshot (HTML đã được render từ template).
     */
    public byte[] renderPdf(String htmlContent) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(htmlContent);
            renderer.layout();
            renderer.createPDF(out);
            return out.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            log.error("Lỗi render PDF hợp đồng: {}", e.getMessage(), e);
            throw new BusinessException("Không thể tạo file PDF hợp đồng. Vui lòng thử lại sau.");
        }
    }

    public String formatDate(Instant instant) {
        return instant == null ? "" : VN_DATE.format(instant);
    }

    public String formatDate(java.time.LocalDate date) {
        return date == null ? "" : date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    public String formatCurrency(Long amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount).replace(',', '.') + " đồng";
    }

    public String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) return "0";
        return formatCurrency(amount.longValue());
    }
}
