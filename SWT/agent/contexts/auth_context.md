# Code Context — Module: Authentication
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === RegisterRequest ===
@NotBlank(message = "Email không được để trống")
@Email(message = "Email không hợp lệ")
private String email;

@NotBlank(message = "Mật khẩu không được để trống")
@Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
@Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).*$",
         message = "Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 chữ số")
private String password;

@NotBlank(message = "Họ tên không được để trống")
private String fullName;

@ValidPhoneNumber  // message = "Số điện thoại không hợp lệ"
// Regex: ^(\+84|0)[3-9]\d{8}$ → bắt đầu 0 hoặc +84, số thứ 2 phải [3-9], sau đó 8 chữ số
private String phoneNumber;

@NotBlank(message = "Vai trò không được để trống")
@Pattern(regexp = "^(TENANT|LANDLORD)$",
         message = "Vai trò chỉ có thể là TENANT hoặc LANDLORD")
private String role;

// === LoginRequest ===
@NotBlank(message = "Email không được để trống")
@Email(message = "Email không hợp lệ")
private String email;

@NotBlank(message = "Mật khẩu không được để trống")
private String password;

// === VerifyOtpRequest ===
@NotBlank(message = "Email không được để trống")
@Email(message = "Email không hợp lệ")
private String email;

@NotBlank(message = "OTP không được để trống")
@Size(min = 6, max = 6, message = "OTP phải có 6 ký tự")
private String otp;

// === ChangePasswordRequest ===
@NotBlank(message = "Mật khẩu cũ không được để trống")
private String oldPassword;

@NotBlank(message = "Mật khẩu mới không được để trống")
@Size(min = 6, message = "Mật khẩu mới phải có ít nhất 6 ký tự")
private String newPassword;

// === ResetPasswordRequest ===
@NotBlank(message = "Email không được để trống")
@Email(message = "Email không hợp lệ")
private String email;

@NotBlank(message = "Mã OTP không được để trống")
private String otp;

@NotBlank(message = "Mật khẩu mới không được để trống")
@Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
private String newPassword;
```

---

## Ô 2 — Controller endpoints

```java
// Base URL: /api/v1/auth

POST /api/v1/auth/register
  Request : RegisterRequest (@Valid)
  Response: HTTP 201 CREATED
  Body    : {"success": true, "message": "Thành công",
             "data": {"message": "Vui lòng kiểm tra email để xác minh tài khoản"}}

POST /api/v1/auth/verify-otp
  Request : VerifyOtpRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Xác thực tài khoản thành công. Bạn đã có thể đăng nhập."}

POST /api/v1/auth/resend-otp
  Request : ResendOtpRequest (@Valid) — chỉ cần email
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Mã OTP mới đã được gửi vào email của bạn."}

POST /api/v1/auth/login
  Request : LoginRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công",
             "data": {"accessToken": "...", "refreshToken": "...",
                      "user": {"id": 1, "email": "...", "fullName": "...", "role": "TENANT"}}}

POST /api/v1/auth/google
  Request : GoogleLoginRequest — {googleId, email, fullName, avatarUrl}
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": {accessToken, refreshToken, user}}

POST /api/v1/auth/refresh
  Request : RefreshTokenRequest — {refreshToken}
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": {accessToken, refreshToken, user}}

POST /api/v1/auth/forgot-password
  Request : ForgotPasswordRequest — {email}
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Mã OTP khôi phục đã được gửi vào email của bạn."}

POST /api/v1/auth/reset-password
  Request : ResetPasswordRequest — {email, otp, newPassword}
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."}

POST /api/v1/auth/change-password
  Header  : Authorization: Bearer <accessToken>  [BẮT BUỘC]
  Request : ChangePasswordRequest — {oldPassword, newPassword}
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Chủ động đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị."}
  Nếu không có token: HTTP 401
  Body    : {"success": false, "message": "Vui lòng đăng nhập để sử dụng tính năng này."}

POST /api/v1/auth/logout
  Header  : Authorization: Bearer <accessToken>  [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Đăng xuất thành công"}
  Nếu không có token: HTTP 401
  Body    : {"success": false, "message": "Vui lòng đăng nhập để sử dụng tính năng này."}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation lỗi (@Valid thất bại) → HTTP 400
{"success": false, "message": "Dữ liệu không hợp lệ", "data": {"fieldName": "error message"}}

// Các message lỗi nghiệp vụ thực tế (BusinessException) → HTTP 400
"Email đã được sử dụng: {email}"
"Mã OTP không hợp lệ hoặc đã hết hạn"
"Không tìm thấy người dùng với email: {email}"
"Tài khoản này đã được xác thực trước đó."
"Tài khoản chưa được xác thực email. Vui lòng kiểm tra email của bạn."

// Login thất bại (BadCredentialsException) → HTTP 401
"Email hoặc mật khẩu không đúng"

// Không có quyền (AccessDeniedException) → HTTP 403
"Bạn không có quyền thực hiện hành động này"

// Validation messages từ annotations:
"Email không được để trống"
"Email không hợp lệ"
"Mật khẩu không được để trống"
"Mật khẩu phải có ít nhất 8 ký tự"
"Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 chữ số"
"Họ tên không được để trống"
"Số điện thoại không hợp lệ"
"Vai trò chỉ có thể là TENANT hoặc LANDLORD"
"OTP phải có 6 ký tự"
"Mật khẩu mới phải có ít nhất 6 ký tự"

// Response wrapper chuẩn ApiResponse<T>:
// Success: {"success": true,  "message": "Thành công", "data": {...}, "timestamp": "..."}
// Error  : {"success": false, "message": "...",         "data": null,  "timestamp": "..."}
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| password (Register) | `@Size(min=8)` — **không có max** | 7 ký tự → Fail | 8 ký tự → Pass | N/A | N/A |
| password (Change/Reset) | `@Size(min=6)` — không có max | 5 ký tự → Fail | 6 ký tự → Pass | N/A | N/A |
| otp | `@Size(min=6, max=6)` — cố định 6 | 5 ký tự → Fail | 6 ký tự → Pass | 6 ký tự → Pass | 7 ký tự → Fail |
| phoneNumber | Regex `^(\+84\|0)[3-9]\d{8}$` | "0123456789" → Fail (số 2 phải [3-9]) | "0912345678" → Pass | N/A | N/A |
| role | Enum TENANT/LANDLORD | "OTHER" → Fail | "TENANT" → Pass | "LANDLORD" → Pass | N/A |

**Quan trọng:** password Register chỉ có `min=8`, KHÔNG có max → chỉ 2 điểm BVA, không có at_max/above_max.
