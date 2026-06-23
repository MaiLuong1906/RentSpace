---
name: crew
description: Multi-agent pattern cho RentSpace. Dùng khi task phức tạp cần tách: tìm code (Investigator) → sửa (Builder) → review (Reviewer). Giảm lỗi và tiết kiệm context window.
---

# RentSpace Crew Pattern

## Khi nào dùng

Dùng pattern này khi task có ít nhất 2 trong 3 dấu hiệu:
- Cần tìm code ở nhiều file trước khi sửa
- Sửa liên quan đến 2+ file khác nhau
- Muốn review độc lập sau khi implement

Không cần cho: bug fix 1 dòng, thêm field đơn giản, giải thích code.

---

## 3 VAI TRÒ

### INVESTIGATOR — Chỉ đọc, không sửa

**Nhiệm vụ:** Định vị code liên quan trước khi sửa.

**Output contract (bắt buộc format này):**
```
path:line — symbol/class — ghi chú ngắn
```

Ví dụ RentSpace:
```
backend/src/.../SubscriptionService.java:87 — checkListingLimit() — logic giới hạn tin hiện tại
backend/src/.../ListingService.java:134 — createListing() — điểm gọi checkListingLimit
frontend/src/app/app/landlord/create-listing/page.tsx:42 — form submit handler — điểm trigger tạo tin
```

**Quy tắc:**
- Chỉ dùng Read, Glob, Grep — không Edit, không Write
- Không đề xuất fix, chỉ định vị
- Nếu không tìm thấy sau 3 lần tìm: báo "KHÔNG TÌM THẤY — [lý do]"

---

### BUILDER — Sửa 1-2 file, chính xác

**Nhiệm vụ:** Implement change dựa trên output của Investigator.

**Input:** Path:line cụ thể từ Investigator.

**Output contract:**
```
path:line-range — mô tả thay đổi. verified: OK.
```

Ví dụ:
```
backend/src/.../SubscriptionService.java:87-102 — thêm check max_images theo plan. verified: OK.
frontend/src/.../page.tsx:42-58 — thêm error handling khi vượt giới hạn. verified: OK.
```

**Quy tắc:**
- Tối đa 2 file mỗi lần — nếu cần sửa nhiều hơn, split thành nhiều Builder call
- Không refactor những gì không được yêu cầu
- Không thêm feature ngoài scope
- Sau khi sửa: chạy type check hoặc build confirm nếu có thể

---

### REVIEWER — Kiểm tra diff, không sửa

**Nhiệm vụ:** Review code đã thay đổi.

**Input:** Path:line-range từ Builder.

**Output contract:**
```
path:line: [mức độ] [vấn đề]. [cách sửa].
```

Mức độ: `bug` | `risk` | `nit` | `security`

Ví dụ:
```
SubscriptionService.java:92: bug: so sánh dùng != với Integer object. Đổi thành !plan.getMaxImages().equals(currentImages).
SubscriptionService.java:105: risk: không có null check cho subscription. Thêm Optional hoặc default về FREE plan.
page.tsx:48: nit: error message hardcode, nên dùng i18n key.
```

**Quy tắc:**
- Không khen, không mở đầu — thẳng vào vấn đề
- Security issue: giải thích impact đầy đủ trước, rồi mới format terse
- Chỉ đọc file được chỉ định — không crawl codebase

---

## CHAINING PATTERNS

### Pattern 1: Implement feature mới
```
1. Investigator: "checkListingLimit đang ở đâu, logic hiện tại thế nào?"
2. Builder: "thêm check max_images theo plan tại [path:line từ step 1]"
3. Reviewer: "review diff tại [path:line-range từ step 2]"
```

### Pattern 2: Fix bug
```
1. Investigator: "lỗi X xảy ra ở đâu, flow nào trigger nó?"
2. Builder: "fix tại [path:line từ step 1]"
3. (Reviewer tùy chọn cho bug fix nhỏ)
```

### Pattern 3: Refactor an toàn
```
1. Investigator: "tìm tất cả nơi gọi [method X]"
2. Reviewer: "review những file này trước khi sửa" (pre-review)
3. Builder: "refactor [path:line list từ step 1]"
4. Reviewer: "review diff sau refactor"
```

---

## FILE STRUCTURE RENTSPACE

Để Investigator tìm nhanh hơn — cấu trúc chính:

```
backend/src/main/java/com/rentspace/
├── controller/         # REST endpoints
├── service/            # Business logic
├── repository/         # JPA repositories
├── domain/
│   ├── listing/        # Listing, ListingService, ListingRepository
│   ├── subscription/   # SubscriptionService, SubscriptionLimitAspect, SubscriptionExpiryScheduler
│   ├── payout/         # Payout service
│   └── notification/   # NotificationService
├── infrastructure/
│   └── payment/        # MomoGateway, VnpayGateway, PaymentWebhookRouter
├── common/
│   └── exception/      # GlobalExceptionHandler, custom exceptions
└── config/             # SecurityConfig, beans

frontend/src/
├── app/
│   ├── app/
│   │   ├── landlord/
│   │   │   ├── subscription/   # Sprint 2
│   │   │   ├── payout/         # Sprint 1 (done)
│   │   │   └── analytics/      # Sprint 7
│   │   └── search/             # Sprint 4
│   ├── pricing/                # Sprint 2 frontend
│   └── tim-phong-tro/          # Sprint 6 SEO pages
├── components/ui/      # shadcn/ui components
├── hooks/              # Custom hooks
└── lib/                # utils, api client
```

---

## VÍ DỤ THỰC TẾ — Sprint 2 task

**Task:** "Thêm monthly reset logic cho subscription limit"

```
INVESTIGATOR call:
"Tìm: (1) UserSubscription entity, (2) SubscriptionLimitAspect checkListingLimit,
(3) nơi subscription được load từ DB"

→ Output:
domain/subscription/UserSubscription.java:23 — startedAt field — dùng để tính cycle
aspect/SubscriptionLimitAspect.java:45 — checkListingLimit() — logic check hiện tại
service/SubscriptionService.java:78 — getCurrentPlan() — load plan từ DB

BUILDER call:
"Tại SubscriptionLimitAspect.java:45, thêm logic: đếm listing được tạo từ startedAt
của subscription cycle hiện tại, không phải tổng all-time"

→ Output:
aspect/SubscriptionLimitAspect.java:45-72 — thêm monthly cycle count query. verified: OK.

REVIEWER call:
"Review aspect/SubscriptionLimitAspect.java:45-72"

→ Output:
SubscriptionLimitAspect.java:58: risk: query N+1 khi check mỗi request. Cache result trong RequestScope.
SubscriptionLimitAspect.java:67: nit: biến tên `cnt` không rõ. Đổi thành `listingsThisCycle`.
```
