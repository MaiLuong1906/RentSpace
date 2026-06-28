# Code Context — Module: Profile Management
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === UpdateProfileRequest ===
@Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
private String fullName;

@ValidPhoneNumber // message = "Số điện thoại không hợp lệ"
// Regex: ^(\+84|0)[3-9]\d{8}$ → bắt đầu 0 hoặc +84, số thứ 2 phải [3-9], sau đó 8 chữ số
private String phoneNumber;
```

---

## Ô 2 — Controller endpoints

```java
// Base URL: /api/v1/users

GET /api/v1/users/me
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": UserProfileResponse}

PUT /api/v1/users/me
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : UpdateProfileRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": UserProfileResponse}

PATCH /api/v1/users/me/avatar
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Consumes: multipart/form-data
  Request : Multipart file (param name: "file")
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": UserProfileResponse}
  Nếu file quá lớn: HTTP 413 Payload Too Large ("Kích thước file vượt quá giới hạn cho phép")

GET /api/v1/users/{userId}
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": PublicProfileResponse}

GET /api/v1/users/all
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": List<UserProfileResponse>}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation messages
"Họ tên phải từ 2 đến 100 ký tự"
"Số điện thoại không hợp lệ"
"Kích thước file vượt quá giới hạn cho phép"
"Bạn không có quyền thực hiện hành động này"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| fullName | `@Size(min=2, max=100)` | 1 ký tự → Fail | 2 ký tự → Pass | 100 ký tự → Pass | 101 ký tự → Fail |
| phoneNumber | Regex `^(\+84\|0)[3-9]\d{8}$` | "0123456789" → Fail (số 2 phải [3-9]) | "0912345678" → Pass | N/A | N/A |
| avatar file | Max size limit (e.g. 5MB) | N/A | 100KB → Pass | 5MB → Pass | 5.1MB → Fail |
