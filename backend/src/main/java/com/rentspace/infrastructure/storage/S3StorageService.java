package com.rentspace.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.UUID;

@Service
@Slf4j
public class S3StorageService {

    private final Path rootLocation;

    public S3StorageService() {
        // Thư mục lưu file mặc định ở root project: "uploads"
        this.rootLocation = Paths.get("uploads");
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize local storage", e);
        }
    }

    public String uploadFile(MultipartFile file, String folder) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file.");
            }
            // Tạo thư mục con (VD: uploads/avatars)
            Path folderPath = this.rootLocation.resolve(folder);
            if (!Files.exists(folderPath)) {
                Files.createDirectories(folderPath);
            }

            // Đổi tên file để tránh trùng lặp
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename().replace(" ", "_");
            Path destinationFile = folderPath.resolve(Paths.get(filename))
                    .normalize().toAbsolutePath();

            // Lưu file
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Sinh URL trả về Frontend (Ví dụ: http://localhost:8080/uploads/avatars/123.jpg)
            String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            String fileUrl = baseUrl + "/uploads/" + folder + "/" + filename;
            
            log.info("Lưu file local thành công: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("Lỗi khi lưu file local: {}", e.getMessage());
            throw new RuntimeException("Lỗi lưu file: " + e.getMessage());
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            // fileUrl có dạng: http://localhost:8080/uploads/avatars/123.jpg
            // Cắt lấy phần sau /uploads/
            String pathStr = fileUrl.substring(fileUrl.indexOf("/uploads/") + 9);
            Path filePath = this.rootLocation.resolve(pathStr).normalize().toAbsolutePath();
            Files.deleteIfExists(filePath);
            log.info("Xóa file local thành công: {}", pathStr);
        } catch (Exception e) {
            log.warn("Không thể xóa file local: {}", e.getMessage());
        }
    }
}
