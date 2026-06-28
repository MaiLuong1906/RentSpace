# Code Context — Module: Rental Contract
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === ContractAiRequest ===
@NotBlank(message = "Câu hỏi không được để trống")
@Size(max = 1000, message = "Câu hỏi không được vượt quá 1000 ký tự")
private String question;
```

---

## Ô 2 — Controller endpoints

```java
// Base URL: /api/v1/contracts

GET /api/v1/contracts/{id}
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": ContractResponse}
  Nếu không thuộc về hợp đồng: HTTP 403 Forbidden ("Bạn không có quyền xem thông tin hợp đồng này")

POST /api/v1/contracts/{id}/sign
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": ContractResponse}

GET /api/v1/contracts/{id}/pdf
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Content-Type: application/pdf
  Body    : File nhị phân (.pdf)
  Header  : Content-Disposition: attachment; filename="contract-{id}.pdf"

GET /api/v1/contracts/mine
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request parameters:
    - status: ContractStatus (optional) — Enum: PENDING, SIGNED, EXPIRED, CANCELLED
    - Pageable params (page, size, sort)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": Page<ContractResponse>}

POST /api/v1/contracts/{id}/ai/ask
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : ContractAiRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": ContractAiResponse}
  Nếu vượt quá lượt hỏi trong ngày: HTTP 429 Too Many Requests ("Hôm nay bạn đã hết lượt hỏi AI cho hợp đồng này")

GET /api/v1/contracts/{id}/ai/quota
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": AiQuotaResponse}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation errors
"Câu hỏi không được để trống"
"Câu hỏi không được vượt quá 1000 ký tự"
"Hôm nay bạn đã hết lượt hỏi AI cho hợp đồng này"
"Bạn không có quyền xem thông tin hợp đồng này"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| question | `@Size(max=1000)` | N/A | N/A | 1000 ký tự → Pass | 1001 ký tự → Fail |
| AI ask quota | Max quota limit (e.g. 5 questions/day) | N/A | 1 câu hỏi → Pass | 5 câu hỏi → Pass | 6 câu hỏi → Fail (HTTP 429) |
