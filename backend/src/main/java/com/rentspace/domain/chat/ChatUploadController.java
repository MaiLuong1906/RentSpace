package com.rentspace.domain.chat;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.infrastructure.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Controller xử lý upload ảnh/video/file trong chat.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat Upload", description = "Upload ảnh/video/file trong tin nhắn")
public class ChatUploadController {

    // ===== Định dạng ảnh hỗ trợ =====
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final List<String> ALLOWED_IMAGE_EXTS = List.of(
            "jpg", "jpeg", "png", "gif", "webp"
    );
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024; // 5 MB

    // ===== Định dạng video hỗ trợ =====
    private static final List<String> ALLOWED_VIDEO_TYPES = List.of(
            "video/mp4", "video/quicktime", "video/x-msvideo",
            "video/x-matroska", "video/webm", "video/mpeg"
    );
    private static final List<String> ALLOWED_VIDEO_EXTS = List.of(
            "mp4", "mov", "avi", "webm", "mkv", "mpeg", "3gp"
    );
    private static final long MAX_VIDEO_SIZE = 100L * 1024 * 1024; // 100 MB

    // ===== Định dạng tài liệu hỗ trợ =====
    private static final List<String> ALLOWED_FILE_TYPES = List.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/zip",
            "application/x-rar-compressed",
            "application/x-7z-compressed",
            "text/plain"
    );
    private static final List<String> ALLOWED_FILE_EXTS = List.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "7z", "txt"
    );
    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024; // 20 MB

    private final StorageService storageService;

    // Helper lấy phần mở rộng của tệp tin
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    // ===== POST /api/v1/chat/upload-image =====
    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload ảnh để gửi trong chat (JPEG/PNG/GIF/WEBP, tối đa 5MB)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadChatImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        String ext = getFileExtension(originalFilename);

        log.info("Request upload ảnh từ User {}: tên={}, contentType={}, size={}, ext={}",
                userDetails.getUsername(), originalFilename, contentType, file.getSize(), ext);

        boolean isAllowed = (contentType != null && ALLOWED_IMAGE_TYPES.contains(contentType))
                || ALLOWED_IMAGE_EXTS.contains(ext);

        if (!isAllowed) {
            log.warn("Định dạng ảnh không hợp lệ: contentType={}, ext={}", contentType, ext);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Chỉ hỗ trợ ảnh định dạng JPEG, PNG, GIF, WEBP")
            );
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Ảnh không được vượt quá 5MB")
            );
        }

        String fileUrl = storageService.uploadFile(file, "chat-images");
        log.info("User {} upload ảnh chat thành công: {}", userDetails.getUsername(), fileUrl);
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công",
                Map.of("fileUrl", fileUrl, "messageType", "IMAGE")));
    }

    // ===== POST /api/v1/chat/upload-video =====
    @PostMapping(value = "/upload-video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload video để gửi trong chat (MP4/MOV/AVI/WebM/MKV, tối đa 100MB)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadChatVideo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        String ext = getFileExtension(originalFilename);

        log.info("Request upload video từ User {}: tên={}, contentType={}, size={}, ext={}",
                userDetails.getUsername(), originalFilename, contentType, file.getSize(), ext);

        boolean isAllowed = (contentType != null && ALLOWED_VIDEO_TYPES.contains(contentType))
                || ALLOWED_VIDEO_EXTS.contains(ext);

        if (!isAllowed) {
            log.warn("Định dạng video không hợp lệ: contentType={}, ext={}", contentType, ext);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Chỉ hỗ trợ video MP4, MOV, AVI, WebM, MKV")
            );
        }
        if (file.getSize() > MAX_VIDEO_SIZE) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Video không được vượt quá 100MB")
            );
        }

        String fileUrl = storageService.uploadFile(file, "chat-videos");
        log.info("User {} upload video chat thành công: {}", userDetails.getUsername(), fileUrl);
        return ResponseEntity.ok(ApiResponse.success("Upload video thành công",
                Map.of("fileUrl", fileUrl, "messageType", "VIDEO")));
    }

    // ===== POST /api/v1/chat/upload-file =====
    @PostMapping(value = "/upload-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload tài liệu để gửi trong chat (PDF/Word/Excel/ZIP..., tối đa 20MB)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadChatFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        String ext = getFileExtension(originalFilename);

        log.info("Request upload tài liệu từ User {}: tên={}, contentType={}, size={}, ext={}",
                userDetails.getUsername(), originalFilename, contentType, file.getSize(), ext);

        boolean isAllowed = (contentType != null && ALLOWED_FILE_TYPES.contains(contentType))
                || ALLOWED_FILE_EXTS.contains(ext);

        if (!isAllowed) {
            log.warn("Định dạng tài liệu không hợp lệ: contentType={}, ext={}", contentType, ext);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Định dạng tài liệu không được hỗ trợ (PDF, Word, Excel, PowerPoint, ZIP, RAR, TXT)")
            );
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Tài liệu không được vượt quá 20MB")
            );
        }

        String safeFilename = originalFilename != null ? originalFilename : "document";
        String fileUrl = storageService.uploadFile(file, "chat-files");
        log.info("User {} upload file chat thành công: {}", userDetails.getUsername(), fileUrl);
        return ResponseEntity.ok(ApiResponse.success("Upload tài liệu thành công",
                Map.of("fileUrl", fileUrl, "messageType", "FILE", "fileName", safeFilename)));
    }
}
