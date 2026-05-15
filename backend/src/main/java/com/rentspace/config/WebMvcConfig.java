package com.rentspace.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Cấu hình serve static files từ thư mục uploads/ cho môi trường dev.
 * Cho phép truy cập ảnh qua URL: GET http://localhost:8080/uploads/{folder}/{filename}
 */
@Configuration
@Profile("dev")
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.storage.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve absolute path, đảm bảo kết thúc bằng "/" (Spring yêu cầu)
        String absoluteUploadPath = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        if (!absoluteUploadPath.endsWith("/")) {
            absoluteUploadPath = absoluteUploadPath + "/";
        }

        log.info("Serving static files from: {}", absoluteUploadPath);

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(absoluteUploadPath)
                .setCachePeriod(0);  // Không cache khi dev
    }
}
