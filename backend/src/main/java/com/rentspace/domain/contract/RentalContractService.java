package com.rentspace.domain.contract;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.user.User;
import com.rentspace.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalContractService {

    private final RentalContractRepository contractRepository;
    private final StorageService storageService;

    @Transactional
    public RentalContract generateAndSaveContract(DepositTransaction transaction) {
        log.info("Generating PDF rental contract for transaction ID: {}", transaction.getId());

        Listing listing = transaction.getListing();
        User tenant = transaction.getTenant();
        User landlord = transaction.getLandlord();

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, out);

            document.open();

            // Fonts
            Font titleFont = getVietnameseFont(true, 18);
            Font headerFont = getVietnameseFont(true, 12);
            Font normalFont = getVietnameseFont(false, 10);
            Font boldFont = getVietnameseFont(true, 10);

            // Title
            Paragraph title = new Paragraph("CONG HOA XA HOI CHU NGHIA VIET NAM\nDoc lap - Tu do - Hanh phuc\n\n", headerFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph title2 = new Paragraph("HOP DONG THUE PHONG TRO (RENTAL CONTRACT)\n", titleFont);
            title2.setAlignment(Element.ALIGN_CENTER);
            document.add(title2);

            Paragraph subTitle = new Paragraph("Ma giao dich dat coc (Deposit Transaction ID): " + transaction.getId() + "\n\n", normalFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subTitle);

            // Intro
            Paragraph intro = new Paragraph("Hom nay, ngay " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ", chung toi gom co:\n\n", normalFont);
            document.add(intro);

            // Landlord info
            Paragraph partyA = new Paragraph("BEN CHO THUE (PARTY A - LANDLORD):\n", headerFont);
            document.add(partyA);
            Paragraph landlordInfo = new Paragraph(
                    "Ho va ten (Full Name): " + landlord.getFullName() + "\n" +
                    "Email: " + landlord.getEmail() + "\n" +
                    "So dien thoai (Phone): " + (landlord.getPhoneNumber() != null ? landlord.getPhoneNumber() : "N/A") + "\n\n",
                    normalFont
            );
            document.add(landlordInfo);

            // Tenant info
            Paragraph partyB = new Paragraph("BEN THUE (PARTY B - TENANT):\n", headerFont);
            document.add(partyB);
            Paragraph tenantInfo = new Paragraph(
                    "Ho va ten (Full Name): " + tenant.getFullName() + "\n" +
                    "Email: " + tenant.getEmail() + "\n" +
                    "So dien thoai (Phone): " + (tenant.getPhoneNumber() != null ? tenant.getPhoneNumber() : "N/A") + "\n\n",
                    normalFont
            );
            document.add(tenantInfo);

            // Terms
            Paragraph termsHeader = new Paragraph("CAC DIEU KHOAN THOA THUAN (TERMS & CONDITIONS):\n", headerFont);
            document.add(termsHeader);

            Paragraph terms = new Paragraph();
            terms.setFont(normalFont);
            terms.add(new Chunk("1. Dia chi phong thue (Address): ", boldFont));
            terms.add(new Chunk(listing.getAddress() + ", " + listing.getWard() + ", " + listing.getDistrict() + ", " + listing.getCity() + "\n"));
            
            terms.add(new Chunk("2. Gia thue hang thang (Monthly Rent): ", boldFont));
            terms.add(new Chunk(String.format("%,d VND/thang\n", listing.getPricePerMonth() != null ? listing.getPricePerMonth().longValue() : 0L)));
            
            terms.add(new Chunk("3. Tien dat coc escrow (Deposit Amount): ", boldFont));
            terms.add(new Chunk(String.format("%,d VND\n", transaction.getAmount())));
            
            terms.add(new Chunk("4. Ngay nhan phong (Move-in Date): ", boldFont));
            terms.add(new Chunk(transaction.getMoveInDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + "\n"));
            
            terms.add(new Chunk("5. Trach nhiem: ", boldFont));
            terms.add(new Chunk("Hop dong nay duoc sinh ra tu dong lam bang chung xac thuc cho khoan dat coc bao ve giao dich giua hai ben thong qua nen tang RentSpace. Ben A cam ket chuan bi phong nhu mo ta. Ben B cam ket thanh toan dung han.\n\n"));
            document.add(terms);

            // Signatures
            Paragraph signatures = new Paragraph("DA DUOC XAC NHAN VA KY DIEN TU THONG QUA HET HONG ESCROW RENTSPACE\n(Electronically Signed and Verified via RentSpace Escrow System)", boldFont);
            signatures.setAlignment(Element.ALIGN_CENTER);
            document.add(signatures);

            document.close();

            byte[] pdfBytes = out.toByteArray();
            String filename = "contract_" + transaction.getId() + ".pdf";

            // Upload PDF using storageService
            String pdfUrl = storageService.uploadFile(pdfBytes, filename, "application/pdf", "contracts");

            // Save to database
            RentalContract contract = RentalContract.builder()
                    .transaction(transaction)
                    .listing(listing)
                    .tenant(tenant)
                    .landlord(landlord)
                    .contractUrl(pdfUrl)
                    .startDate(transaction.getMoveInDate())
                    .endDate(transaction.getMoveInDate().plusMonths(12)) // Default 1 year duration
                    .monthlyRent(listing.getPricePerMonth() != null ? listing.getPricePerMonth().longValue() : 0L)
                    .depositAmount(transaction.getAmount())
                    .build();

            return contractRepository.save(contract);

        } catch (Exception e) {
            log.error("Failed to generate and save contract PDF", e);
            throw new RuntimeException("Loi khi tao hop dong PDF: " + e.getMessage(), e);
        }
    }

    private Font getVietnameseFont(boolean isBold, float size) {
        String[] fontPaths;
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            fontPaths = isBold 
                ? new String[]{"C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/timesbd.ttf", "C:/Windows/Fonts/tahomabd.ttf"}
                : new String[]{"C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/times.ttf", "C:/Windows/Fonts/tahoma.ttf"};
        } else {
            // Linux / Docker container fallbacks
            fontPaths = isBold
                ? new String[]{
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                    "/usr/share/fonts/liberation/LiberationSans-Bold.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
                }
                : new String[]{
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                    "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
                };
        }

        for (String path : fontPaths) {
            try {
                java.io.File file = new java.io.File(path);
                if (file.exists()) {
                    com.lowagie.text.pdf.BaseFont bf = com.lowagie.text.pdf.BaseFont.createFont(
                        path, 
                        com.lowagie.text.pdf.BaseFont.IDENTITY_H, 
                        com.lowagie.text.pdf.BaseFont.EMBEDDED
                    );
                    return new Font(bf, size);
                }
            } catch (Exception e) {
                log.warn("Failed to load font from path: {}", path, e);
            }
        }

        // Fallback if no system fonts found
        log.warn("No suitable Vietnamese system fonts found. Falling back to default Helvetica.");
        return FontFactory.getFont(
            isBold ? FontFactory.HELVETICA_BOLD : FontFactory.HELVETICA, 
            size
        );
    }
}
