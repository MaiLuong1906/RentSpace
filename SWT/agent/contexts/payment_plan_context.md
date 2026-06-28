# Code Context — Module: Payment Plan
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === SubscribeRequest ===
@NotNull(message = "ID gói cước không được để trống")
private Integer planId;

private Boolean autoRenew = false;
```

---

## Ô 2 — Controller endpoints

```java
// === Subscription Plans (Public) ===
GET /api/v1/subscriptions/plans
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Lấy danh sách gói cước thành công", "data": List<SubscriptionPlanResponse>}

// === Landlord Subscriptions (LANDLORD) ===
GET /api/v1/landlord/subscriptions/current
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('LANDLORD')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Lấy thông tin gói cước thành công", "data": UserSubscriptionResponse}

POST /api/v1/landlord/subscriptions/subscribe
  Header  : Authorization: Bearer <accessToken> [BẮT BUỎC]
  PreAuth : hasRole('LANDLORD')
  RateLimit: capacity = 3, durationInSeconds = 60
  Request parameters:
    - method: String (optional, default = "VNPAY")
  Request : SubscribeRequest (@Valid)
  Response: HTTP 200 OK
  Nếu là gói Free:
    Body  : {"success": true, "message": "Đã kích hoạt gói cước Miễn phí thành công", "data": {"paymentUrl": "FREE"}}
  Nếu là gói trả phí:
    Body  : {"success": true, "message": "Khởi tạo thanh toán nâng cấp gói cước thành công", "data": {"paymentUrl": "http://payment.gateway/..."}}
  Nếu thiếu Authorization hoặc không phải LANDLORD: HTTP 403 Forbidden ("Bạn không có quyền thực hiện hành động này")
  Nếu gửi yêu cầu quá nhanh (quá 3 req/phút): HTTP 429 Too Many Requests ("Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau.")
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation & Exception responses
"ID gói cước không được để trống"
"Bạn không có quyền thực hiện hành động này"
"Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau."
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| planId | `@NotNull` | Null → Fail | 1 → Pass | N/A | N/A |
| autoRenew | Boolean | N/A | true → Pass | false → Pass | N/A |
| method | String | N/A | "VNPAY" → Pass | "MOMO" → Pass | N/A |
