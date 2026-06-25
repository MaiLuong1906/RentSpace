package com.rentspace.domain.contract;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractTemplateServiceTest {

    @Mock
    private TemplateEngine templateEngine;

    @InjectMocks
    private ContractTemplateService service;

    // XHTML tối giản hợp lệ với Flying Saucer
    private static final String MINIMAL_XHTML = """
            <?xml version="1.0" encoding="UTF-8"?>
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head><title>Test Contract</title></head>
            <body><p>Nội dung hợp đồng thử nghiệm.</p></body>
            </html>
            """;

    // ── renderPdf ────────────────────────────────────────────────────────────

    @Test
    void renderPdf_withValidXhtml_returnsNonEmptyByteArray() {
        byte[] pdf = service.renderPdf(MINIMAL_XHTML);

        assertThat(pdf).isNotEmpty();
        // PDF phải bắt đầu bằng magic bytes %PDF
        String header = new String(pdf, 0, Math.min(4, pdf.length));
        assertThat(header).isEqualTo("%PDF");
    }

    @Test
    void renderPdf_outputIsValidPdfSize() {
        byte[] pdf = service.renderPdf(MINIMAL_XHTML);

        // File PDF thực tế phải lớn hơn 100 bytes
        assertThat(pdf.length).isGreaterThan(100);
    }

    // ── buildContentSnapshot ─────────────────────────────────────────────────

    @Test
    void buildContentSnapshot_delegatesToTemplateEngine() {
        Map<String, Object> vars = Map.of(
                "landlordName", "Nguyễn Văn A",
                "tenantName",   "Trần Thị B"
        );
        when(templateEngine.process(eq("contracts/rental-agreement"), any(Context.class)))
                .thenReturn("<html>Hợp đồng: Nguyễn Văn A - Trần Thị B</html>");

        String result = service.buildContentSnapshot(vars);

        assertThat(result).contains("Nguyễn Văn A").contains("Trần Thị B");
    }

    // ── formatCurrency ───────────────────────────────────────────────────────

    @Test
    void formatCurrency_withLong_returnsVietnameseFormat() {
        String result = service.formatCurrency(5_000_000L);
        assertThat(result).contains("5.000.000").contains("đồng");
    }

    @Test
    void formatCurrency_withBigDecimal_returnsVietnameseFormat() {
        String result = service.formatCurrency(new BigDecimal("3500000"));
        assertThat(result).contains("3.500.000").contains("đồng");
    }

    @Test
    void formatCurrency_withNull_returnsZero() {
        assertThat(service.formatCurrency((Long) null)).isEqualTo("0");
        assertThat(service.formatCurrency((BigDecimal) null)).isEqualTo("0");
    }

    // ── formatDate ───────────────────────────────────────────────────────────

    @Test
    void formatDate_withInstant_returnsVietnameseDateFormat() {
        // 2025-06-15 UTC → 15/06/2025 hoặc 16/06/2025 tuỳ timezone, nhưng pattern phải đúng
        Instant instant = Instant.parse("2025-06-15T10:00:00Z");
        String result = service.formatDate(instant);
        assertThat(result).matches("\\d{2}/\\d{2}/\\d{4}");
    }

    @Test
    void formatDate_withLocalDate_returnsVietnameseDateFormat() {
        LocalDate date = LocalDate.of(2025, 6, 15);
        String result = service.formatDate(date);
        assertThat(result).isEqualTo("15/06/2025");
    }

    @Test
    void formatDate_withNullInstant_returnsEmptyString() {
        assertThat(service.formatDate((Instant) null)).isEmpty();
    }

    @Test
    void formatDate_withNullLocalDate_returnsEmptyString() {
        assertThat(service.formatDate((LocalDate) null)).isEmpty();
    }
}
