# Code Context — Module: Payout Management
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === PayoutAccountRequest ===
@NotBlank(message = "Tên ngân hàng không được để trống")
@Size(max = 100, message = "Tên ngân hàng không được quá 100 ký tự")
private String bankName;

@NotBlank(message = "Mã ngân hàng không được để trống")
@Size(max = 20, message = "Mã ngân hàng không được quá 20 ký tự")
private String bankCode;

@NotBlank(message = "Số tài khoản không được để trống")
@Size(max = 50, message = "Số tài khoản không được quá 50 ký tự")
private String accountNumber;

@NotBlank(message = "Tên chủ tài khoản không được để trống")
@Size(max = 200, message = "Tên chủ tài khoản không được quá 200 ký tự")
private String accountName;

// === ProcessPayoutRequest ===
@NotNull(message = "Trạng thái giải ngân không được để trống")
private PayoutStatus status; // Enum: PENDING, COMPLETED, FAILED

private String bankRef;
private String note;
```

---

## Ô 2 — Controller endpoints

```java
// === Landlord Payout Account & History ===
PUT /api/v1/landlord/payout-account
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('LANDLORD')
  Request : PayoutAccountRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Liên kết tài khoản ngân hàng thành công", "data": PayoutAccountResponse}

GET /api/v1/landlord/payout-account
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('LANDLORD')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Lấy thông tin tài khoản ngân hàng thành công", "data": PayoutAccountResponse}

GET /api/v1/landlord/payouts
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('LANDLORD')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Lấy danh sách yêu cầu giải ngân thành công", "data": Page<PayoutResponse>}

// === Admin Payout Management ===
GET /api/v1/admin/payouts
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request parameters:
    - status: PayoutStatus (optional, default = "PENDING")
    - Pageable params (page, size, sort)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Lấy danh sách yêu cầu giải ngân thành công", "data": Page<PayoutResponse>}

POST /api/v1/admin/payouts/{id}/process
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('ADMIN')
  Request : ProcessPayoutRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Xử lý yêu cầu giải ngân thành công", "data": PayoutResponse}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation errors
"Tên ngân hàng không được để trống"
"Tên ngân hàng không được quá 100 ký tự"
"Mã ngân hàng không được để trống"
"Mã ngân hàng không được quá 20 ký tự"
"Số tài khoản không được để trống"
"Số tài khoản không được quá 50 ký tự"
"Tên chủ tài khoản không được để trống"
"Tên chủ tài khoản không được quá 200 ký tự"
"Trạng thái giải ngân không được để trống"
"Bạn không có quyền thực hiện hành động này"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| bankName | `@Size(max=100)` | N/A | N/A | 100 ký tự → Pass | 101 ký tự → Fail |
| bankCode | `@Size(max=20)` | N/A | N/A | 20 ký tự → Pass | 21 ký tự → Fail |
| accountNumber | `@Size(max=50)` | N/A | N/A | 50 ký tự → Pass | 51 ký tự → Fail |
| accountName | `@Size(max=200)` | N/A | N/A | 200 ký tự → Pass | 201 ký tự → Fail |
