# Code Context — Module: Post Approval
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === UpdateListingStatusRequest ===
@NotNull(message = "Trạng thái không được để trống")
private ListingStatus status; // Enum: PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, DELETED
```

---

## Ô 2 — Controller endpoints

```java
// Base URL: /api/v1/admin/listings

PATCH /api/v1/admin/listings/{id}/approve
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Duyệt tin đăng thành công", "data": ListingResponse}
  Nếu không phải ADMIN: HTTP 403 Forbidden ("Bạn không có quyền thực hiện hành động này")

PATCH /api/v1/admin/listings/{id}/reject
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request parameter:
    - reason: String (optional, default = "Nội dung tin đăng không phù hợp hoặc thiếu thông tin")
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Đã từ chối duyệt tin đăng", "data": ListingResponse}

PATCH /api/v1/admin/listings/{id}/status
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request : UpdateListingStatusRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Cập nhật trạng thái tin đăng thành công", "data": ListingResponse}

GET /api/v1/admin/listings
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request parameter:
    - status: ListingStatus (optional)
    - Pageable params (page, size, sort)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": Page<ListingResponse>}

// === Community Feed Admin Actions ===
PATCH /api/v1/posts/{id}/hidden
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request parameter:
    - isHidden: boolean (required)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Đã ẩn bài viết" / "Đã hiển thị lại bài viết"}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Exception Handler responses
"Bạn không có quyền thực hiện hành động này"
"Trạng thái không được để trống"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| status | Enum ListingStatus | "INVALID_STATUS" → Fail | "APPROVED" → Pass | "REJECTED" → Pass | N/A |
| isHidden | Boolean | N/A | true → Pass | false → Pass | N/A |
