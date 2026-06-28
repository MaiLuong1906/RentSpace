# Code Context — Module: KYC Verification
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === EkycCompleteRequest ===
@NotBlank(message = "Session ID không được trống")
private String sessionId;

private String cccdFrontImage; // Base64-encoded string
private String cccdBackImage;  // Base64-encoded string
private String faceImage;      // Base64-encoded string

@Valid
private OcrData ocrData;

private String simulationMode; // "SUCCESS", "NEED_REVIEW", "FAIL"

// === OcrData ===
private String idNumber;
private String fullName;
private String dateOfBirth;
private String gender;
private String hometown;
```

---

## Ô 2 — Controller endpoints

```java
// Base URL: /api/v1/kyc

POST /api/v1/kyc/submit
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Consumes: multipart/form-data
  Request : Multipart file (param name: "cccdImage")
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Nộp hồ sơ KYC thành công, vui lòng chờ duyệt"}
  Nếu thiếu ảnh: HTTP 400 Bad Request ("Vui lòng chọn ảnh CCCD")
  Nếu ảnh > 5MB: HTTP 400 Bad Request ("Kích thước ảnh tối đa là 5MB")
  Nếu file không phải ảnh: HTTP 400 Bad Request ("File phải là định dạng ảnh")

GET /api/v1/kyc/status
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Lấy trạng thái KYC thành công", "data": KycStatusResponse}

POST /api/v1/kyc/ekyc/init
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Khởi tạo phiên eKYC thành công", "data": EkycInitResponse}

POST /api/v1/kyc/ekyc/complete
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : EkycCompleteRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Xác thực eKYC hoàn tất", "data": KycStatusResponse}

// === Admin KYC APIs ===
GET /api/v1/kyc/admin/pending
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Tìm thấy X hồ sơ đang chờ duyệt", "data": List<KycReviewItem>}

GET /api/v1/kyc/admin/list
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request parameter:
    - status: String (optional, default = "PENDING")
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Tìm thấy X hồ sơ với trạng thái Y", "data": List<KycReviewItem>}
  Nếu status không hợp lệ: HTTP 400 ("Status không hợp lệ. Dùng: PENDING, VERIFIED, REJECTED")

PATCH /api/v1/kyc/admin/{userId}/approve
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Đã duyệt KYC cho user id=X"}

PATCH /api/v1/kyc/admin/{userId}/reject
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request parameter:
    - reason: String (optional, default = "Không đáp ứng yêu cầu")
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Đã từ chối KYC cho user id=X"}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation errors
"Session ID không được trống"
"Vui lòng chọn ảnh CCCD"
"Kích thước ảnh tối đa là 5MB"
"File phải là định dạng ảnh"
"Status không hợp lệ. Dùng: PENDING, VERIFIED, REJECTED"
"Bạn không có quyền thực hiện hành động này"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| cccdImage file | Max 5MB | N/A | 1KB → Pass | 5MB → Pass | 5.1MB → Fail |
| sessionId | `@NotBlank` | Trống/Khoảng trắng → Fail | "session_123" → Pass | N/A | N/A |
| status (admin list)| PENDING/VERIFIED/REJECTED | "OTHER" → Fail | "PENDING" → Pass | "VERIFIED" → Pass | N/A |
