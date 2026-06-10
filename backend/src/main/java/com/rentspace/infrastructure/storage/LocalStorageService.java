package com.rentspace.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Lưu file vào local disk — dùng cho môi trường dev.
 * Không cần AWS credentials.
 * File được lưu tại: {upload-dir}/{folder}/{uuid}_{filename}
 * Trả về URL: http://localhost:8080/uploads/{folder}/{uuid}_{filename}
 */
@Service
@Primary  // Ưu tiên bean này trong dev (override S3StorageService)
@Profile("dev")
@Slf4j
public class LocalStorageService implements StorageService {

    @Value("${app.storage.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.storage.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File không được để trống");
        }

        String originalFilename = file.getOriginalFilename();
        String safeFilename = UUID.randomUUID() + "_" + (originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "file");
        String relativePath = folder + "/" + safeFilename;

        try {
            Path targetDir = Paths.get(uploadDir, folder);
            Files.createDirectories(targetDir);

            Path targetFile = targetDir.resolve(safeFilename);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = baseUrl + "/" + folder + "/" + safeFilename;
            log.info("Upload file local thành công: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("Lỗi khi lưu file local: {}", e.getMessage());
            throw new RuntimeException("Không thể lưu file: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;

        try {
            // Lấy path tương đối từ URL: http://localhost:8080/uploads/avatars/xxx.jpg → avatars/xxx.jpg
            String relativePath = fileUrl.replace(baseUrl + "/", "");
            Path filePath = Paths.get(uploadDir, relativePath);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Đã xóa file local: {}", filePath);
            } else {
                log.warn("File local không tồn tại, bỏ qua: {}", filePath);
            }
        } catch (IOException e) {
            log.warn("Không thể xóa file local: {}", e.getMessage());
        }
    }

    @Override
    public String uploadFile(byte[] content, String filename, String contentType, String folder) {
        if (content == null || content.length == 0) {
            throw new RuntimeException("Nội dung file không được để trống");
        }

        String safeFilename = UUID.randomUUID() + "_" + filename.replaceAll("[^a-zA-Z0-9._-]", "_");

        try {
            Path targetDir = Paths.get(uploadDir, folder);
            Files.createDirectories(targetDir);

            Path targetFile = targetDir.resolve(safeFilename);
            Files.write(targetFile, content);

            String fileUrl = baseUrl + "/" + folder + "/" + safeFilename;
            log.info("Upload byte array local thành công: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("Lỗi khi lưu file local từ byte array: {}", e.getMessage());
            throw new RuntimeException("Không thể lưu file: " + e.getMessage());
        }
    }

    @Override
    public String getPresignedUrl(String fileUrl) {
        // Môi trường local dev không cần ký bảo mật, trả trực tiếp URL để frontend hiển thị
        return fileUrl;
    }
}

