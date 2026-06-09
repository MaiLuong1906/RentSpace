# 🚀 Kế hoạch Code Chi Tiết — Phase 2 (Growth)
> RentSpace — Nền tảng thuê trọ | Nối tiếp Phase 1 | Thời gian: 12 tuần (+ Sprint 0) | Quy mô: Solo Developer

---

## 📌 Đồng bộ với codebase Phase 1

> Tài liệu này đã được đối chiếu trực tiếp với codebase (không dựa vào README). Các quy ước **bắt buộc** tuân theo:

| Hạng mục | Phase 1 (hiện tại) | Phase 2 (kế hoạch) |
|---|---|---|
| **Primary key** | `BIGSERIAL` / `Long` | Giữ `BIGSERIAL` — **không** dùng UUID |
| **API base** | `/api/v1/*` | Tiếp tục `/api/v1/*` — **không** tạo `/api/v2` |
| **Flyway** | V1–V11 đã chạy | Phase 2 bắt đầu từ **V12** |
| **KYC** | Cột trên bảng `users` (`kyc_status`, `cccd_image_url`) | `ALTER TABLE users` thêm cột eKYC |
| **Community UI** | `/app/community` (UI shell, chưa có API) | Wire API vào trang sẵn có |
| **KYC UI** | `/app/kyc` | Giữ route hiện tại |
| **Luồng liên hệ** | Chat WebSocket Phase 1 (`ListingDetailClient` → nhắn tin) | Trigger đặt cọc sau chat — **không** có đặt lịch xem phòng |
| **Tiền tệ listing** | `BigDecimal pricePerMonth` | Giữ nguyên; **chỉ** bảng payment/deposit dùng `Long` VND |

**Flyway đã dùng (không được ghi đè):**
- V10 — `add_message_type_to_messages`
- V11 — `add_rating_breakdown_to_reviews`

---

## 📋 Điều kiện bắt đầu Phase 2

> Phase 2 chỉ được khởi động khi Phase 1 đã đạt **tất cả** các mốc sau:

| Mốc kiểm tra | Tiêu chí | Trạng thái codebase |
|---|---|---|
| ✅ **Tính năng ổn định** | Toàn bộ Phase 1 deploy production, không bug nghiêm trọng trong 2 tuần | Cần xác nhận khi deploy |
| ✅ **Người dùng thật** | ≥ 50 tài khoản thật, 20 tin đăng active | Cần xác nhận metrics |
| ✅ **Feedback thu thập** | Feedback từ ≥ 10 người dùng thật | Cần xác nhận |
| ✅ **Nợ kỹ thuật** | Không có issue nghiêm trọng bị bỏ qua từ Phase 1 | — |
| ✅ **Pháp lý cơ bản** | Trang Terms of Service và Privacy Policy trên website | ⚠️ Hiện chỉ có checkbox `href="#"` trên `/auth/register` — **làm trong Sprint 0** |
| ✅ **Merchant account** | Đã đăng ký sandbox VNPay (production lead time 2–4 tuần) | Chưa có trong `.env.example` — **làm trong Sprint 0** |

---

## 🗂️ Tổng quan Phase 2

Phase 2 tập trung vào **3 mục tiêu chiến lược**:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🔒 Bảo vệ giao dịch      💡 Tăng giá trị nền tảng          │
│  Đặt cọc Escrow            KYC tự động + Feed cộng đồng      │
│  VNPay (MoMo → Phase 2.5)  Tìm bạn ở ghép                  │
│                            Hợp đồng điện tử cơ bản          │
│                                                              │
│  📈 Mở rộng tăng trưởng                                      │
│  Boost tin chủ trọ (monetization đầu tiên)                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Epic của Phase 2 (scope realistic cho solo dev)

| Epic | Tên | Sprint | Độ phức tạp |
|---|---|---|---|
| EP-0 | Pre-work & hạ tầng | Sprint 0 | 🟢 Thấp |
| EP-1 | Đặt cọc Escrow + Hợp đồng cơ bản | Sprint 1–2 | 🔴 Cao |
| EP-2 | KYC tự động (eKYC API) | Sprint 3 | 🟡 Trung bình |
| EP-3 | Feed cộng đồng | Sprint 4 | 🟡 Trung bình |
| EP-4 | Tìm bạn ở ghép | Sprint 5 | 🟡 Trung bình |
| EP-5 | Boost tin chủ trọ + Metrics | Sprint 6 | 🟡 Trung bình |

### ⏸️ Defer sang Phase 2.5 / Phase 3

| Tính năng | Lý do defer |
|---|---|
| MoMo / ZaloPay | Tập trung VNPay trước, tránh tích hợp song song 2 cổng |
| Seller Pro (subscription) | Phase 3; cần đủ chủ trọ trả tiền trước |
| Gợi ý giá thuê | Cold start — chưa đủ giao dịch hoàn tất |
| Dashboard quản lý phòng nâng cao | Scope lớn, ưu tiên sau luồng đặt cọc |
| Đặt lịch xem phòng | Phase 1 không có; trigger đặt cọc qua chat thay thế |
| Mở rộng TP.HCM, Hà Nội | Phase 3 |

---

## 🗄️ Database Schema — Bổ sung Phase 2

> Tất cả bảng mới dùng `BIGSERIAL` khớp với `users.id`, `listings.id` hiện tại.
> Số tiền giao dịch (deposit, promote, contract) lưu `BIGINT` (VND nguyên).
> `listings.price_per_month` giữ `DECIMAL` — không refactor trong Phase 2.

```sql
-- ============================================================
-- V12: DEPOSIT — Giao dịch đặt cọc Escrow
-- ============================================================
CREATE TABLE deposit_transactions (
    id                  BIGSERIAL PRIMARY KEY,
    listing_id          BIGINT NOT NULL REFERENCES listings(id),
    tenant_id           BIGINT NOT NULL REFERENCES users(id),
    landlord_id         BIGINT NOT NULL REFERENCES users(id),
    amount              BIGINT NOT NULL,                          -- VND nguyên
    platform_fee        BIGINT NOT NULL,
    net_amount          BIGINT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT'
                        CHECK (status IN (
                            'PENDING_PAYMENT',
                            'PAID',
                            'DISPUTED',
                            'RELEASED',
                            'REFUNDED',
                            'CANCELLED'
                        )),
    payment_method      VARCHAR(20),                              -- 'VNPAY'
    payment_gateway_ref VARCHAR(255),
    payment_url         TEXT,
    paid_at             TIMESTAMPTZ,
    released_at         TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    release_deadline    TIMESTAMPTZ,
    move_in_date        DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deposit_transaction_events (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  BIGINT NOT NULL REFERENCES deposit_transactions(id),
    event_type      VARCHAR(50) NOT NULL,
    actor_id        BIGINT REFERENCES users(id),
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deposit_tx_tenant ON deposit_transactions(tenant_id);
CREATE INDEX idx_deposit_tx_landlord ON deposit_transactions(landlord_id);
CREATE INDEX idx_deposit_tx_status ON deposit_transactions(status);
CREATE INDEX idx_deposit_tx_listing ON deposit_transactions(listing_id);

-- ============================================================
-- V13: DISPUTES — Tranh chấp giao dịch đặt cọc
-- ============================================================
CREATE TABLE deposit_disputes (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  BIGINT NOT NULL REFERENCES deposit_transactions(id) UNIQUE,
    opened_by       BIGINT NOT NULL REFERENCES users(id),
    reason          VARCHAR(50) NOT NULL
                    CHECK (reason IN (
                        'ROOM_NOT_AS_DESCRIBED',
                        'LANDLORD_NO_SHOW',
                        'TENANT_NO_SHOW',
                        'DEPOSIT_DISPUTE',
                        'OTHER'
                    )),
    description     TEXT NOT NULL,
    evidence_urls   TEXT[],
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_TENANT', 'RESOLVED_LANDLORD', 'CLOSED')),
    resolution_note TEXT,
    resolved_by     BIGINT REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- V14: KYC AUTO — Bổ sung eKYC trên bảng users (Phase 1 lưu KYC tại đây)
-- ============================================================
ALTER TABLE users
    ADD COLUMN ekyc_session_id  VARCHAR(255),
    ADD COLUMN ekyc_result      JSONB,
    ADD COLUMN ekyc_confidence  DECIMAL(5,2),
    ADD COLUMN ekyc_verified_at TIMESTAMPTZ,
    ADD COLUMN kyc_review_mode  VARCHAR(20) DEFAULT 'MANUAL'
                                CHECK (kyc_review_mode IN ('AUTO', 'MANUAL'));

-- User đã VERIFIED qua manual Phase 1: kyc_review_mode giữ 'MANUAL', không yêu cầu eKYC lại

-- ============================================================
-- V15: POSTS — Bài đăng cộng đồng (wire vào /app/community)
-- ============================================================
CREATE TABLE posts (
    id              BIGSERIAL PRIMARY KEY,
    author_id       BIGINT NOT NULL REFERENCES users(id),
    type            VARCHAR(30) NOT NULL
                    CHECK (type IN (
                        'ROOMMATE',     -- ↔ UI: roommate — Tìm bạn ở ghép
                        'TIPS',         -- ↔ UI: tips — Tips & Kinh nghiệm
                        'REVIEW',       -- ↔ UI: review — Review phòng trọ / khu vực
                        'QUESTION'      -- ↔ UI: question — Hỏi đáp
                    )),
    content         TEXT NOT NULL,
    image_urls      TEXT[],
    related_listing BIGINT REFERENCES listings(id),
    district        VARCHAR(100),
    like_count      INTEGER DEFAULT 0,
    comment_count   INTEGER DEFAULT 0,
    report_count    INTEGER DEFAULT 0,
    is_hidden       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_likes (
    post_id     BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE post_comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id   BIGINT NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    is_hidden   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_reports (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id),
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    reason      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, reporter_id)
);

CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);

-- ============================================================
-- V16: ROOMMATE — Hồ sơ tìm bạn ở ghép
-- ============================================================
CREATE TABLE roommate_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    gender          VARCHAR(20),
    occupation      VARCHAR(100),
    budget_min      BIGINT,
    budget_max      BIGINT,
    preferred_area  VARCHAR(255),
    move_in_date    DATE,
    lifestyle_tags  TEXT[],
    bio             TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roommate_matches (
    id              BIGSERIAL PRIMARY KEY,
    profile_a_id    BIGINT NOT NULL REFERENCES roommate_profiles(id),
    profile_b_id    BIGINT NOT NULL REFERENCES roommate_profiles(id),
    match_score     DECIMAL(5,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'SUGGESTED'
                    CHECK (status IN ('SUGGESTED', 'VIEWED', 'CONTACTED', 'DISMISSED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_a_id, profile_b_id)
);

CREATE INDEX idx_roommate_profiles_active ON roommate_profiles(is_active);
CREATE INDEX idx_roommate_matches_score ON roommate_matches(match_score DESC);

-- ============================================================
-- V17: CONTRACTS — Hợp đồng thuê cơ bản (template PDF)
-- ============================================================
CREATE TABLE rental_contracts (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  BIGINT NOT NULL REFERENCES deposit_transactions(id) UNIQUE,
    listing_id      BIGINT NOT NULL REFERENCES listings(id),
    tenant_id       BIGINT NOT NULL REFERENCES users(id),
    landlord_id     BIGINT NOT NULL REFERENCES users(id),
    contract_url    TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    monthly_rent    BIGINT NOT NULL,
    deposit_amount  BIGINT NOT NULL,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- V18: PROMOTED LISTINGS — Tin đăng nổi bật (boost)
-- ============================================================
CREATE TABLE promoted_listings (
    id              BIGSERIAL PRIMARY KEY,
    listing_id      BIGINT NOT NULL REFERENCES listings(id),
    landlord_id     BIGINT NOT NULL REFERENCES users(id),
    starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    amount_paid     BIGINT NOT NULL,
    payment_ref     VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_promoted_active ON promoted_listings(is_active, expires_at);

-- ============================================================
-- V19: LISTING VIEWS — Tracking lượt xem (phục vụ analytics Sprint 6)
-- ============================================================
CREATE TABLE listing_views (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT NOT NULL REFERENCES listings(id),
    viewer_id   BIGINT REFERENCES users(id),    -- NULL = anonymous
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_views_listing_date ON listing_views(listing_id, viewed_at DESC);
```

---

## 📡 API Contract — Endpoints mới Phase 2

> Tiếp tục namespace `/api/v1` — khớp `SecurityConfig`, `RateLimitConfig`, axios frontend.
> Module mới đặt trong `domain/deposit`, `domain/post`, `domain/roommate`, … theo convention hiện tại.

```yaml
# ── DEPOSIT / ESCROW ──────────────────────────────────────────
POST   /api/v1/deposits                         # Người thuê tạo giao dịch đặt cọc
GET    /api/v1/deposits/:id                     # Chi tiết giao dịch
GET    /api/v1/deposits                         # Lịch sử giao dịch (tenant / landlord view)
POST   /api/v1/deposits/:id/initiate-payment    # Lấy payment URL (VNPay)
POST   /api/v1/deposits/webhook/vnpay           # VNPay callback (public, verify signature)
PATCH  /api/v1/deposits/:id/confirm-move-in     # Người thuê xác nhận đã nhận phòng → giải ngân
PATCH  /api/v1/deposits/:id/dispute             # Mở tranh chấp (chỉ khi status = PAID)
GET    /api/v1/admin/deposits                   # Admin xem tất cả [ADMIN]
PATCH  /api/v1/admin/disputes/:id/resolve       # Admin giải quyết tranh chấp [ADMIN]

# ── RENTAL CONTRACT ───────────────────────────────────────────
GET    /api/v1/deposits/:id/contract            # Tải hợp đồng PDF (sau RELEASED)
POST   /api/v1/deposits/:id/contract/generate   # Tạo hợp đồng từ template [system/admin]

# ── KYC AUTO (mở rộng /api/v1/kyc hiện có) ───────────────────
POST   /api/v1/kyc/ekyc/init                    # Khởi tạo session eKYC, nhận SDK token
POST   /api/v1/kyc/ekyc/complete                # Frontend gọi sau khi eKYC SDK hoàn thành
GET    /api/v1/kyc/status                       # Đã có Phase 1 — bổ sung trường eKYC

# ── COMMUNITY FEED ────────────────────────────────────────────
GET    /api/v1/posts                            # Feed (filter type, cursor pagination)
POST   /api/v1/posts                            # Tạo bài đăng mới
GET    /api/v1/posts/:id
PUT    /api/v1/posts/:id
DELETE /api/v1/posts/:id
POST   /api/v1/posts/:id/like                   # Toggle like
GET    /api/v1/posts/:id/comments
POST   /api/v1/posts/:id/comments
POST   /api/v1/posts/:id/report                 # Báo cáo bài viết

# ── ROOMMATE MATCHING ─────────────────────────────────────────
GET    /api/v1/roommates/profile                # Hồ sơ ở ghép của tôi
PUT    /api/v1/roommates/profile                # Tạo / cập nhật hồ sơ
GET    /api/v1/roommates/suggestions            # Gợi ý bạn ở ghép phù hợp
PATCH  /api/v1/roommates/matches/:id/dismiss    # Đánh dấu không phù hợp

# ── MONETIZATION & ANALYTICS ──────────────────────────────────
POST   /api/v1/listings/:id/promote             # Mua gói boost (VNPay)
GET    /api/v1/listings/:id/promote/status      # Trạng thái boost hiện tại
POST   /api/v1/listings/:id/view                # Ghi nhận lượt xem (idempotent/session)
GET    /api/v1/landlord/analytics               # Views, messages, deposits (30 ngày)
```

**SecurityConfig bổ sung:**
```java
// Public endpoints cần thêm:
"/api/v1/deposits/webhook/vnpay"   // VNPay IPN callback
"/api/v1/listings/*/view"          // Optional: cho phép anonymous view tracking
```

**NotificationType enum bổ sung:** `DEPOSIT`, `PAYMENT`, `ROOMMATE`

---

## 🏃 Kế hoạch Sprint Chi tiết

---

### Sprint 0 — Pre-work & Hạ tầng (3–5 ngày, trước Sprint 1)

**Mục tiêu:** Chuẩn bị nền tảng kỹ thuật và đóng gap Phase 1 trước khi code tính năng mới.

**Backend tasks:**
- [ ] Thêm `@EnableScheduling` + dependency scheduling vào `pom.xml`
- [ ] Thêm OpenPDF (hoặc iText) vào `pom.xml` cho sinh hợp đồng PDF
- [ ] Tạo package `domain/deposit`, `infrastructure/payment` (VNPay service skeleton)
- [ ] Bổ sung biến môi trường VNPay vào `.env.example`:
  ```
  VNPAY_TMN_CODE=
  VNPAY_HASH_SECRET=
  VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  VNPAY_RETURN_URL=http://localhost:3000/app/payment/result
  VNPAY_IPN_URL=http://localhost:8080/api/v1/deposits/webhook/vnpay
  ```
- [ ] Mở rộng `NotificationType`: `DEPOSIT`, `PAYMENT`, `ROOMMATE`
- [ ] Đăng ký VNPay sandbox merchant account

**Frontend tasks:**
- [ ] Trang `/terms` và `/privacy` (nội dung cơ bản) — sửa link trên `/auth/register` từ `href="#"` sang URL thật
- [ ] Tạo folder `src/lib/api/deposit.api.ts` (skeleton)
- [ ] Tạo route placeholder `/app/deposits`, `/app/payment/result`

**Gate:** Hoàn thành Sprint 0 trước khi bắt đầu migration V12.

---

### Sprint 1 — Đặt cọc: Tạo giao dịch & Tích hợp VNPay (Tuần 1–2)

**Mục tiêu:** Người thuê có thể đặt cọc qua VNPay. Tiền cọc được giữ Escrow trên nền tảng.

> **Lưu ý môi trường:** Dev/staging dùng VNPay sandbox. Production chỉ bật khi có merchant account và legal review xong.

**Luồng UX (khớp Phase 1):**
```
Xem tin → Nhắn tin chủ trọ (chat Phase 1) → Nút "Đặt cọc an toàn" trên trang chi tiết phòng
```
> Phase 1 **không có** đặt lịch xem phòng. Không build scheduling trong Phase 2.

**Backend tasks:**
- [ ] Migration V12: bảng `deposit_transactions` và `deposit_transaction_events`
- [ ] Entity `DepositTransaction`, `DepositTransactionEvent` + Repository (`Long` id)
- [ ] `DepositController` — `@RequestMapping("/api/v1/deposits")`
- [ ] `POST /deposits` — Validate: listing ACTIVE, tenant ≠ landlord, chưa có deposit PAID/DISPUTED cho listing+tenant
- [ ] Tích hợp VNPay: tạo payment URL, cấu hình sandbox credentials
- [ ] `POST /deposits/:id/initiate-payment` — VNPay URL với amount, orderId, returnUrl
- [ ] `POST /deposits/webhook/vnpay` — Verify HMAC-SHA512, idempotent (Redis), log event
- [ ] Sau callback thành công → status `PAID`, `release_deadline = NOW() + 7 ngày`
- [ ] Thông báo email + in-app (`NotificationType.DEPOSIT`) cho tenant và landlord
- [ ] Cập nhật `SecurityConfig`: public webhook endpoint

**Frontend tasks:**
- [ ] Nút "Đặt cọc an toàn" trên `ListingDetailClient` (sau khi user đã đăng nhập)
- [ ] Modal xác nhận: số tiền cọc, phí nền tảng, số tiền chủ trọ nhận, ngày dự kiến nhận phòng
- [ ] Trang `/app/checkout/[depositId]` — Redirect VNPay
- [ ] Trang `/app/payment/result` — Kết quả thanh toán
- [ ] Trang `/app/deposits` — Lịch sử giao dịch (view tenant / landlord)

**Yêu cầu kỹ thuật bắt buộc:**
```
- Webhook PHẢI verify HMAC-SHA512 trước khi xử lý logic
- Webhook idempotent: cùng orderId → chỉ xử lý 1 lần (Redis key webhook_processed:{txnRef})
- Số tiền deposit/promote: Long (VND nguyên) — KHÔNG dùng float/Double
- Payment URL TTL: 15 phút
- Log webhook payload vào deposit_transaction_events TRƯỚC KHI xử lý
- @RateLimit trên POST /deposits và initiate-payment
```

---

### Sprint 2 — Escrow lifecycle, Tranh chấp & Hợp đồng cơ bản (Tuần 3–4)

**Mục tiêu:** Hoàn thiện vòng đời đặt cọc: giải ngân, hoàn tiền, tranh chấp. Sinh hợp đồng PDF sau giải ngân.

**State machine giao dịch:**
```
PENDING_PAYMENT → PAID → RELEASED
                    ↓         ↑
                 DISPUTED ────┘ (admin resolve)
                    ↓
              REFUNDED / RELEASED
```

**Backend tasks:**
- [ ] Migration V13: bảng `deposit_disputes`
- [ ] Migration V17: bảng `rental_contracts`
- [ ] `PATCH /deposits/:id/confirm-move-in` — Tenant xác nhận → `RELEASED`
- [ ] `@Scheduled` cron: auto-release mỗi giờ nếu `PAID` + `release_deadline < NOW()` + không có dispute mở
- [ ] `PATCH /deposits/:id/dispute` — Chỉ khi status = `PAID`
- [ ] `AdminDisputeController` — resolve → `REFUNDED` hoặc `RELEASED`
- [ ] Tính `platform_fee` (2%, tối đa 100.000 VND) — dùng `Long`
- [ ] `POST /deposits/:id/contract/generate` — Sinh PDF (OpenPDF) → upload S3 qua `StorageService`
- [ ] API tóm tắt giao dịch cho landlord (số completed, tổng net_amount theo tuần/tháng)

**Frontend tasks:**
- [ ] Trang `/app/deposits/[id]` — Timeline trạng thái, nút "Xác nhận đã nhận phòng", "Mở tranh chấp"
- [ ] Form tranh chấp: lý do, upload ảnh (tối đa 5, 5MB/ảnh), mô tả
- [ ] Trang `/app/admin/disputes` — Danh sách, evidence, resolve (mở rộng admin layout hiện có)
- [ ] Nút tải hợp đồng PDF sau `RELEASED`

**Yêu cầu kỹ thuật:**
```
- Cron auto-release: log số bản ghi xử lý + thời gian chạy
- Dispute CHỈ mở khi status = 'PAID'
- Sau RELEASED / REFUNDED → reject dispute mới
- Sandbox: giải ngân = cập nhật DB; production payout API → Phase 2.5
- Evidence upload S3 qua StorageService, tối đa 5 ảnh/dispute
```

---

### Sprint 3 — KYC Tự động (VNPT eKYC) (Tuần 5–6)

**Mục tiêu:** Bổ sung eKYC tự động, giữ fallback duyệt thủ công Phase 1.

**Backend tasks:**
- [ ] Migration V14: `ALTER TABLE users` thêm cột eKYC (xem schema V14)
- [ ] Đăng ký VNPT eKYC API (hoặc VNeid) → API key sandbox
- [ ] Mở rộng `KycController` (`/api/v1/kyc`):
  - `POST /kyc/ekyc/init` — Session + SDK token
  - `POST /kyc/ekyc/complete` — Nhận kết quả API
- [ ] confidence ≥ 80% → `KycStatus.VERIFIED`; 60–79% → `PENDING` + `kyc_review_mode=MANUAL`; < 60% → `REJECTED`
- [ ] API lỗi/timeout → fallback `MANUAL` review
- [ ] Giữ nguyên `KycAdminController` + `KycService.approveKyc/rejectKyc`

**Frontend tasks:**
- [ ] Cập nhật `/app/kyc`: flow eKYC (SDK VNPT trong iframe/modal)
- [ ] Loading 5–15 giây, hiển thị kết quả rõ ràng
- [ ] User đã `VERIFIED` qua manual Phase 1 → skip eKYC, hiển thị badge "Đã xác thực"

**Yêu cầu kỹ thuật:**
```
- eKYC session token TTL: 10 phút
- Retry: 2 lần (backoff 1s, 3s) → fallback manual
- Không lưu raw ảnh CCCD nếu provider xử lý phía họ
- Log ekyc_result (JSONB) trên users để audit
```

---

### Sprint 4 — Feed Cộng đồng (Tuần 7–8)

**Mục tiêu:** Wire API vào trang `/app/community` đã có sẵn (UI shell Phase 1).

**Mapping Post type (DB ↔ Frontend):**

| DB enum | UI `PostType` | Tab filter |
|---|---|---|
| `ROOMMATE` | `roommate` | Tìm bạn ở ghép |
| `TIPS` | `tips` | Tips & Kinh nghiệm |
| `REVIEW` | `review` | Review phòng trọ |
| `QUESTION` | `question` | Hỏi đáp |

**Backend tasks:**
- [ ] Migration V15: `posts`, `post_likes`, `post_comments`, `post_reports`
- [ ] `PostController` — `@RequestMapping("/api/v1/posts")`
- [ ] `POST /posts` — Text + ảnh (tối đa 5 qua S3), related_listing optional, district
- [ ] `GET /posts` — Cursor pagination, filter `type`
- [ ] Feed algorithm Phase 2: `created_at DESC` + ưu tiên engagement cao trong 24h
- [ ] `POST /posts/:id/like` — Toggle, Redis counter
- [ ] `POST /posts/:id/comments` — Flat comments (không nested)
- [ ] `POST /posts/:id/report` — Auto-hide khi ≥ 3 report/giờ
- [ ] Admin ẩn bài (mở rộng admin module)

**Frontend tasks:**
- [ ] Refactor `/app/community` — fetch từ API thay mock `posts: []`
- [ ] Tách `PostCard`, `PostForm`, `CommentSection` ra `components/community/`
- [ ] Đồng bộ enum `PostType` với DB (bảng mapping trên)
- [ ] Entry point Feed trên `/app` (trang chủ dashboard)
- [ ] Nút báo cáo bài viết

**Yêu cầu kỹ thuật:**
```
- Rate limit: max 5 bài/ngày (tài khoản < 7 ngày)
- Rate limit: max 20 bài/ngày (đã KYC VERIFIED)
- JOIN FETCH author khi load feed (tránh N+1)
```

---

### Sprint 5 — Tìm bạn ở ghép (Tuần 9–10)

**Mục tiêu:** Ghép người thuê ở chung theo ngân sách, khu vực, lifestyle.

**Backend tasks:**

Thuật toán matching (rule-based):
```
1. Lấy profile A của user hiện tại
2. Tìm profile B active, B ≠ A, preferred_area overlap
3. Score =
     + budget overlap (0–40)
     + lifestyle_tags overlap (0–30)
     + move_in_date proximity (0–20)
     + gender preference (0–10)
4. Loại matches DISMISSED
5. Top 10, match_score ≥ 50
```

- [ ] Migration V16: `roommate_profiles`, `roommate_matches`
- [ ] `RoommateController` — `@RequestMapping("/api/v1/roommates")`
- [ ] `PUT /roommates/profile` — CRUD hồ sơ
- [ ] `GET /roommates/suggestions` — Gợi ý + match_score
- [ ] `PATCH /roommates/matches/:id/dismiss`
- [ ] Yêu cầu `KycStatus.VERIFIED` trước khi dùng tính năng
- [ ] Cache Redis TTL 1 giờ, invalidate khi profile cập nhật
- [ ] Notification `ROOMMATE`: cron 12 giờ — "Có N gợi ý mới"

**Frontend tasks:**
- [ ] Trang `/app/roommates` — Form hồ sơ + danh sách gợi ý
- [ ] `RoommateCard` — Avatar, bio, tags, % phù hợp, "Nhắn tin"
- [ ] Nhắn tin qua chat Phase 1 (`chatApi.createConversation`) — không build chat mới
- [ ] Nút "Không phù hợp"

---

### Sprint 6 — Boost tin chủ trọ + Metrics (Tuần 11–12)

**Mục tiêu:** Luồng doanh thu đầu tiên + dashboard metrics tối thiểu cho chủ trọ.

**Backend tasks:**
- [ ] Migration V18: `promoted_listings`
- [ ] Migration V19: `listing_views` (nếu chưa tạo sớm hơn)
- [ ] `POST /listings/:id/view` — Ghi nhận view (dedupe: 1 view/user/listing/24h)
- [ ] `POST /listings/:id/promote` — Gói 1/3/7 ngày, VNPay (reuse webhook + Redis idempotency)
- [ ] Sau webhook → `promoted_listings`, set `expires_at`
- [ ] `ListingRepository` search: `ORDER BY is_promoted DESC, created_at DESC`
- [ ] Cron 15 phút: deactivate promoted hết hạn
- [ ] `GET /landlord/analytics` — views, messages (từ `conversations`), deposits (30 ngày)

**Frontend tasks:**
- [ ] `/app/landlord/my-listings` — Nút "Đẩy tin lên đầu" + bảng giá
- [ ] Badge "Nổi bật" trên `ListingCard` (search + detail)
- [ ] Trang `/app/landlord/analytics` — Chart đơn giản (Recharts đã có trong stack)
- [ ] Gọi `POST /listings/:id/view` khi mở trang chi tiết phòng

**Không làm trong Sprint 6 (defer):**
- Seller Pro subscription → Phase 3
- Gợi ý giá thuê → Phase 2.5
- Analytics nâng cao (funnel, cohort) → Phase 3

---

## 📏 Tiêu chuẩn Code bổ sung cho Phase 2

### Xử lý Thanh toán — Nguyên tắc bất di bất dịch

```java
@RestController
@RequestMapping("/api/v1/deposits")
public class DepositWebhookController {

    @PostMapping("/webhook/vnpay")
    public ResponseEntity<String> vnpayWebhook(
            HttpServletRequest request,
            @RequestBody Map<String, String> params) {

        if (!vnpayService.verifySignature(params)) {
            log.warn("Invalid VNPay webhook signature: {}", params);
            return ResponseEntity.ok("INVALID_SIGNATURE");
        }

        String txnRef = params.get("vnp_TxnRef");
        if (redisService.exists("webhook_processed:" + txnRef)) {
            return ResponseEntity.ok("ALREADY_PROCESSED");
        }

        depositEventService.logWebhookReceived(txnRef, params);

        try {
            depositService.processVnpayCallback(params);
            redisService.set("webhook_processed:" + txnRef, "1", Duration.ofDays(7));
        } catch (Exception e) {
            log.error("Error processing VNPay webhook for {}: {}", txnRef, e.getMessage());
            depositEventService.logWebhookError(txnRef, e);
        }

        return ResponseEntity.ok("OK");
    }
}
```

```java
// ✅ Số tiền giao dịch LUÔN dùng Long (VND) — áp dụng deposit, promote, contract
// listings.pricePerMonth giữ BigDecimal — không đổi Phase 2
Long depositAmount = 2_000_000L;
Long fee = Math.min(depositAmount * 2 / 100, 100_000L);
Long netAmount = depositAmount - fee;
```

### Feed & Social — Tránh N+1 Query

```java
@Query("SELECT p FROM Post p JOIN FETCH p.author u ORDER BY p.createdAt DESC")
List<Post> findAllWithAuthor(Pageable pageable);
```

### Caching Strategy — Phase 2

```
Dữ liệu                         | TTL    | Invalidate khi
──────────────────────────────── | ────── | ─────────────────────────
Roommate suggestions user A      | 1 giờ  | Profile A hoặc B được sửa
Feed homepage (top 20 posts)     | 5 phút | Có post mới
Like count của post Z            | 30 giây| Realtime (Redis INCR)
Promoted listings list           | 15 phút| Có promote mới / hết hạn
Landlord analytics (30 ngày)     | 1 giờ  | Có view/message/deposit mới
```

---

## 🧪 Chiến lược Testing Phase 2

### Happy Path bắt buộc phải test trước khi deploy

```
Đặt cọc flow:
  Tạo deposit → Lấy payment URL → Simulate VNPay webhook →
  Kiểm tra PAID → Tenant confirm-move-in → Kiểm tra RELEASED →
  Tải hợp đồng PDF

Dispute flow:
  Deposit PAID → Mở dispute (trước RELEASED) → Admin resolve tenant →
  Kiểm tra REFUNDED

eKYC flow:
  Init session → Mock callback (confidence 85%) → User VERIFIED

Feed flow:
  Tạo post trên /app/community → Like → Comment → Report

Roommate flow:
  Tạo profile → Nhận suggestions → Dismiss 1 match → Không thấy lại

Boost flow:
  Mua boost 1 ngày → Webhook → Tin hiển thị đầu search → Hết hạn → Badge mất
```

### Test đặc biệt cho Payment

```java
@Test
void webhook_calledTwice_shouldProcessOnlyOnce() {
    mockMvc.perform(post("/api/v1/deposits/webhook/vnpay").content(validPayload));
    assertThat(deposit.getStatus()).isEqualTo("PAID");

    mockMvc.perform(post("/api/v1/deposits/webhook/vnpay").content(validPayload));
    assertThat(depositEventRepo.countByTransactionId(depositId)).isEqualTo(1);
}

@Test
void dispute_afterReleased_shouldBeRejected() {
    deposit.setStatus("RELEASED");
    mockMvc.perform(patch("/api/v1/deposits/" + depositId + "/dispute"))
        .andExpect(status().isBadRequest());
}
```

---

## 🗺️ Lộ trình Phase 2

```
Sprint 0:   Pre-work (3–5 ngày) → Terms/Privacy, scheduling, PDF lib, VNPay env
Tuần 1–2:   Sprint 1 → VNPay + Đặt cọc Escrow cơ bản
Tuần 3–4:   Sprint 2 → Dispute + Auto-release + Hợp đồng PDF
Tuần 5–6:   Sprint 3 → eKYC tự động
Tuần 7–8:   Sprint 4 → Community Feed (wire /app/community)
Tuần 9–10:  Sprint 5 → Tìm bạn ở ghép
Tuần 11–12: Sprint 6 → Boost tin + Analytics dashboard

Sau Tuần 12: Deploy Phase 2, thu thập metrics
  → Tỷ lệ đặt cọc / tổng phòng cho thuê
  → Thời gian trung bình chat → đặt cọc
  → Tỷ lệ tranh chấp / tổng giao dịch
  → Tỷ lệ KYC tự động thành công
  → MAU Feed / MAU tìm phòng
  → Conversion boost tin (view → thanh toán)
  → Số cặp ở ghép matched → nhắn tin
```

---

## ⚠️ Rủi ro & Phương án dự phòng

| Rủi ro | Khả năng | Phương án |
|---|---|---|
| VNPay sandbox khó tích hợp | 🟡 Trung bình | Buffer 1 tuần trong Sprint 1; defer MoMo sang Phase 2.5 |
| Merchant account production chậm | 🟡 Trung bình | Launch escrow sandbox + waitlist; bật production khi có account |
| VNPT eKYC API không ổn định | 🟡 Trung bình | Fallback manual review — user không bị block |
| Feed bị spam khi launch | 🔴 Cao | Rate limit tài khoản mới; report + auto-hide; admin queue |
| Roommate matching chất lượng thấp | 🟡 Trung bình | "Không phù hợp" + yêu cầu KYC VERIFIED |
| Boost không có người mua | 🟢 Thấp | Tặng boost 24h miễn phí cho 10 chủ trọ đầu tiên |
| Pháp lý trung gian thanh toán | 🟡 Trung bình | Escrow qua cổng được cấp phép; tư vấn pháp lý trước production |
| Xung đột migration version | 🟢 Đã xử lý | Phase 2 dùng V12–V19, không ghi đè V1–V11 |

---

## ✅ Definition of Done — Phase 2

Tất cả DoD Phase 1 vẫn áp dụng, bổ sung:

- [ ] Mọi webhook endpoint có test verify signature
- [ ] Mọi logic thanh toán có test idempotency
- [ ] Dispute chỉ mở khi status = PAID (test reject sau RELEASED)
- [ ] Số tiền deposit/promote/contract dùng `Long` (VND) — `listings.pricePerMonth` giữ `BigDecimal`
- [ ] Cron job có logging: số bản ghi, thời gian chạy, lỗi
- [ ] API mới có `@RateLimit` (interceptor `/api/v1/**` đã sẵn)
- [ ] Cache invalidation đã test
- [ ] Hợp đồng PDF chỉ accessible bởi tenant/landlord của giao dịch
- [ ] Terms/Privacy pages live, link từ `/auth/register` hoạt động
- [ ] Flyway migration V12–V19 chạy thành công trên staging

---

*Tài liệu Phase 2 — Đồng bộ codebase: BIGINT ids, /api/v1, Flyway V12+.*
*Cập nhật sau mỗi Sprint Retrospective.*
*Phase 2.5: MoMo + Gợi ý giá thuê + Payout API | Phase 3: Mobile App + Seller Pro + Mở rộng địa bàn*
