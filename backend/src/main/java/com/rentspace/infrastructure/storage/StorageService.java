package com.rentspace.infrastructure.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface trừu tượng hóa tầng lưu trữ file.
 * Hiện tại dùng LocalStorageService (dev). Có thể switch sang S3StorageService khi production.
 */
public interface StorageService {

    /**
     * Upload file vào thư mục chỉ định, trả về URL có thể truy cập.
     *
     * @param file   file cần upload
     * @param folder thư mục con (ví dụ: "avatars", "listings", "kyc")
     * @return URL đầy đủ của file đã upload
     */
    String uploadFile(MultipartFile file, String folder);

    /**
     * Upload file dưới dạng byte array vào thư mục chỉ định, trả về URL có thể truy cập.
     *
     * @param content     mảng byte nội dung file
     * @param filename    tên file mong muốn
     * @param contentType kiểu MIME file (vd: "application/pdf")
     * @param folder      thư mục con (ví dụ: "contracts")
     * @return URL đầy đủ của file đã upload
     */
    String uploadFile(byte[] content, String filename, String contentType, String folder);

    /**
     * Xóa file theo URL.
     *
     * @param fileUrl URL của file cần xóa
     */
    void deleteFile(String fileUrl);

    /**
     * Sinh Presigned URL bảo mật có thời hạn từ URL lưu trữ gốc.
     * Ở môi trường dev (Local), phương thức này trả về chính URL đó.
     * Ở môi trường production (S3), phương thức này tạo link AWS S3 Presigned URL (hết hạn sau 15 phút).
     *
     * @param fileUrl URL lưu trữ gốc của file
     * @return Presigned URL bảo mật
     */
    String getPresignedUrl(String fileUrl);
}
