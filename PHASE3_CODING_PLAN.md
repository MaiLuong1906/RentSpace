# 🌟 Kế hoạch Code Chi Tiết — Phase 3 (Web Scaling, Monetization & Optimization)
> RentSpace — Nền tảng thuê trọ | Nối tiếp Phase 2 | Thời gian: **12 tuần** (Sprints 0–6) + 2 tuần Buffer | Quy mô: Solo Developer
> **Phiên bản:** v3.0 — Định hướng Web-First (Loại bỏ Mobile App & Tối ưu hóa Địa bàn đã triển khai)

---

## 📌 Thay đổi chiến lược trong Phase 3

Dựa trên yêu cầu thực tế:
1. **Loại bỏ Mobile App (React Native/Expo):** Giải phóng 4 Sprints (khoảng 8 tuần). Chuyển dịch toàn bộ hạ tầng thông báo từ Mobile Push sang **Web Push Notifications** (Service Worker) và **Email Transactional Alerts**.
2. **Mở rộng địa bàn đã tích hợp:** Hệ thống tìm kiếm theo Đà Nẵng, Hà Nội, Hồ Chí Minh đã vận hành. Sẽ chuyển trọng tâm sang **SEO Scale** (tạo các landing page tĩnh cho từng khu vực hành chính để tối ưu SEO) thay vì xây dựng lại database thành phố.
3. **Đẩy nhanh Monetization (Kiếm tiền):** Đưa tính năng thanh toán MoMo, rút tiền (Payout), và gói hội viên **Seller Pro** lên giai đoạn đầu của Phase 3 để dự án sớm có dòng tiền.

---

## 🗺️ Lộ trình tổng quan Phase 3 (Web-First)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  💰 Monetization & Payouts (3A)    🚀 SEO & Engagement (3B)     │
│  - Cổng thanh toán MoMo            - Web Push (Service Worker)  │
│  - Rút tiền (Payout) Landlord      - Email Alerts (Thymeleaf)   │
│  - Gói Seller Pro Subscription     - SEO Dynamic Pages (Next.js)│
│  - Gợi ý giá thuê thông minh       - Sitemap & Structured Data  │
│                                                                 │
│  ⚡ Performance & Analytics (3B)                                │
│  - Bản đồ nâng cao & Geo-search                                  │
│  - Landlord Analytics Funnel                                    │
│  - Materialized Views & Redis Cache                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Bảng Epic & Sprint hoàn chỉnh (14 tuần)

| Epic | Tên | Phase | Sprint | Tuần | Độ phức tạp | Milestone |
|---|---|---|---|---|---|---|
| **EP-1** | Setup & Multi-gateway Payment (MoMo) | **3A** | Sprint 0 | 1 | 🟡 Trung bình | Cổng MoMo sandbox hoạt động ổn định |
| **EP-2** | Payout Management & Admin Verification | **3A** | Sprint 1 | 2–3 | 🟡 Trung bình | Landlord liên kết tài khoản ngân hàng & rút tiền |
| **EP-3** | Seller Pro Subscription | **3A** | Sprint 2 | 4–5 | 🔴 Cao | Enforce giới hạn tin đăng và tính năng Pro |
| **EP-4** | Smart Price Suggestion Engine | **3A** | Sprint 3 | 6 | 🟡 Trung bình | Gợi ý khoảng giá tối ưu khi Landlord đăng tin |
| **EP-5** | Advanced Geo-search & Interactive Maps | **3B** | Sprint 4 | 7–8 | 🔴 Cao | Vẽ bản đồ tìm kiếm, quét bán kính động |
| **EP-6** | Web Notifications & Thymeleaf Email Hub | **3B** | Sprint 5 | 9–10 | 🟡 Trung bình | Web Push & Email thông báo sự kiện quan trọng |
| **EP-7** | SEO Scale (Next.js SSG/ISR) & Sitemap | **3B** | Sprint 6 | 11–12 | 🟡 Trung bình | Đăng ký Google Search Console, SEO landing pages |
| **EP-8** | Advanced Analytics & Redis Performance | **3B** | Sprint 7 | 13–14 | 🟢 Thấp | Cải thiện tải trang, Dashboard báo cáo tài chính |

> [!NOTE]
> **Buffer 2 tuần** (Tuần 15-16): Dành cho việc test bảo mật, tối ưu hóa database index, và marketing thử nghiệm (soft launch).

---

## 🗂️ Database Schema — Flyway Migration (V23–V29)

```sql
-- ============================================================
-- V23: PAYMENT — Tích hợp MoMo (Mở rộng từ VNPay hiện tại)
-- ============================================================
ALTER TABLE deposit_transactions 
    ADD COLUMN payment_method_detail JSONB;
-- Lưu trữ metadata của giao dịch MoMo/VNPay dưới dạng JSONB
-- VNPay: { "bankCode": "NCB", "cardType": "ATM" }
-- MoMo:  { "orderType": "momo_wallet", "transId": "..." }

-- ============================================================
-- V24: PAYOUTS — Quản lý giải ngân cho Chủ trọ
-- ============================================================
CREATE TABLE landlord_payout_accounts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    bank_name       VARCHAR(100) NOT NULL,
    bank_code       VARCHAR(20) NOT NULL,
    account_number  VARCHAR(100) NOT NULL,          -- AES-256 mã hóa
    account_name    VARCHAR(200) NOT NULL,
    is_verified     BOOLEAN DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payouts (
    id              BIGSERIAL PRIMARY KEY,
    landlord_id     BIGINT NOT NULL REFERENCES users(id),
    payout_account  BIGINT NOT NULL REFERENCES landlord_payout_accounts(id),
    amount          BIGINT NOT NULL,
    fee             BIGINT NOT NULL DEFAULT 0,
    net_amount      BIGINT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    bank_ref        VARCHAR(255),
    processed_at    TIMESTAMPTZ,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_landlord ON payouts(landlord_id, created_at DESC);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================================
-- V25: PRICE SUGGESTION — Bảng chuẩn so sánh giá thuê
-- ============================================================
ALTER TABLE listings 
    ADD COLUMN room_type VARCHAR(50) 
        CHECK (room_type IN ('PHONG_TRO', 'CHUNG_CU_MINI', 'CHUNG_CU', 'NGAN_GIAN', 'NHA_NGUYEN_CAN'));

-- Backfill dữ liệu hiện có
UPDATE listings SET room_type = 'PHONG_TRO' WHERE room_type IS NULL;

CREATE TABLE price_benchmarks (
    id              BIGSERIAL PRIMARY KEY,
    city            VARCHAR(100) NOT NULL,           -- 'Đà Nẵng' | 'Hà Nội' | 'Hồ Chí Minh'
    district        VARCHAR(100) NOT NULL,
    room_type       VARCHAR(50) NOT NULL,
    area_bucket     VARCHAR(20) NOT NULL,            -- '0-20' | '20-30' | '30-50' | '50+'
    p25_price       BIGINT NOT NULL,
    p50_price       BIGINT NOT NULL,
    p75_price       BIGINT NOT NULL,
    sample_count    INTEGER NOT NULL,
    data_source     VARCHAR(20) NOT NULL DEFAULT 'DEPOSIT'
                    CHECK (data_source IN ('DEPOSIT', 'LISTING')),
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_price_bench_unique ON price_benchmarks(city, district, room_type, area_bucket);

-- ============================================================
-- V26: SELLER PRO — Đăng ký gói dịch vụ hội viên chủ trọ
-- ============================================================
CREATE TABLE subscription_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    price           BIGINT NOT NULL DEFAULT 0,
    duration_days   INTEGER NOT NULL,
    max_listings    INTEGER NOT NULL DEFAULT 10,
    max_images      INTEGER NOT NULL DEFAULT 5,
    boost_credits   INTEGER NOT NULL DEFAULT 0,
    analytics_level VARCHAR(20) NOT NULL DEFAULT 'BASIC'
                    CHECK (analytics_level IN ('BASIC', 'ADVANCED'))
);

INSERT INTO subscription_plans VALUES
    (1, 'FREE', 'Miễn phí', 0, 0, 10, 5, 0, 'BASIC'),
    (2, 'SELLER_PRO_MONTHLY', 'Seller Pro (Tháng)', 99000, 30, 50, 15, 2, 'ADVANCED'),
    (3, 'SELLER_PRO_YEARLY', 'Seller Pro (Năm)', 799000, 365, 50, 15, 25, 'ADVANCED');

CREATE TABLE user_subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    plan_id         INTEGER NOT NULL REFERENCES subscription_plans(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    payment_ref     VARCHAR(255),
    auto_renew      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_user ON user_subscriptions(user_id, status);

-- ============================================================
-- V27: WEB PUSH NOTIFICATIONS — Đăng ký Push Web
-- ============================================================
CREATE TABLE web_push_subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    endpoint        TEXT NOT NULL UNIQUE,
    p256dh          VARCHAR(255) NOT NULL,
    auth            VARCHAR(255) NOT NULL,
    user_agent      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_web_push_user ON web_push_subscriptions(user_id, is_active);

-- ============================================================
-- V28: SEO PAGES — Quản lý metadata động cho landing pages
-- ============================================================
CREATE TABLE seo_pages (
    id              BIGSERIAL PRIMARY KEY,
    path            VARCHAR(500) NOT NULL UNIQUE,     -- e.g. '/tim-phong-tro/da-nang/hai-chau'
    title           VARCHAR(200),
    meta_desc       VARCHAR(500),
    h1              VARCHAR(200),
    last_modified   TIMESTAMPTZ DEFAULT NOW(),
    priority        DECIMAL(3,2) DEFAULT 0.5,
    change_freq     VARCHAR(20) DEFAULT 'weekly'
);

-- ============================================================
-- V29: MATERIALIZED VIEW ANALYTICS — Tối ưu hóa thống kê
-- ============================================================
CREATE MATERIALIZED VIEW landlord_analytics_daily AS
SELECT
    l.landlord_id,
    l.id AS listing_id,
    DATE(lv.viewed_at) AS date,
    COUNT(DISTINCT lv.id) AS view_count,
    COUNT(DISTINCT c.id) AS chat_count,
    COUNT(DISTINCT dt.id) AS deposit_count,
    SUM(CASE WHEN dt.status = 'RELEASED' THEN dt.net_amount ELSE 0 END) AS revenue
FROM listings l
LEFT JOIN listing_views lv ON lv.listing_id = l.id
LEFT JOIN conversations c ON c.listing_id = l.id
LEFT JOIN deposit_transactions dt ON dt.listing_id = l.id
GROUP BY l.landlord_id, l.id, DATE(lv.viewed_at);

CREATE UNIQUE INDEX idx_landlord_analytics_daily ON landlord_analytics_daily(landlord_id, listing_id, date);
```

---

## 🏃 Kế hoạch Sprint Chi tiết (Web-First Roadmap)

### Sprint 0 — Setup & Multi-gateway Payment (Tuần 1)
- **Mục tiêu:** Tích hợp cổng thanh toán MoMo Sandbox cho dòng tiền thứ 2.
- **Backend:**
  - Refactor `VnpayWebhookRouter` thành `PaymentWebhookRouter` hỗ trợ cấu trúc định tuyến mềm dẻo.
  - Xây dựng `PaymentGateway` interface để quản lý VNPay và MoMo đồng nhất.
  - Triển khai `MomoGateway` tích hợp MoMo API v2 (gửi yêu cầu đặt cọc & nhận IPN Webhook qua chữ ký HMAC-SHA256).
  - Áp dụng migration **V23** (`payment_method_detail`).
- **Frontend:**
  - Cập nhật trang nạp cọc / boost tin: Dropdown cho phép chọn "VNPay" hoặc "Ví MoMo".
  - Hoàn thiện luồng redirect và xử lý trạng thái thanh toán sau khi từ MoMo quay lại ứng dụng.

---

### Sprint 1 — Payout System & Admin Operations (Tuần 2–3)
- **Mục tiêu:** Triển khai luồng giải ngân (Payout) minh bạch từ tài khoản Escrow của hệ thống về tài khoản ngân hàng của Landlord.
- **Backend:**
  - Áp dụng migration **V24** (`payout_accounts` & `payouts`).
  - Hỗ trợ lưu trữ tài khoản ngân hàng: mã hóa cột số tài khoản `account_number` bằng AES-256 trước khi xuống DB.
  - Khi một Deposit chuyển sang trạng thái `RELEASED` (người thuê đã nhận phòng hoặc hết thời gian tranh chấp), tự động tạo một lệnh Payout ở trạng thái `PENDING`.
  - API `GET /api/v1/payouts` cho Landlord theo dõi tiến độ giải ngân.
- **Admin Panel (Web):**
  - Quản lý danh sách Payout PENDING.
  - Sau khi Admin thực hiện chuyển khoản thủ công/loạt, bấm "Xác nhận đã chuyển" -> Cập nhật trạng thái Payout sang `COMPLETED` và cập nhật thông tin chứng từ chuyển khoản (`bank_ref`).
- **Frontend:**
  - Trang cài đặt thanh toán cho Landlord: nhập ngân hàng, số tài khoản, tên chủ thẻ.
  - Màn hình lịch sử nhận tiền (Payout) của Landlord.

---

### Sprint 2 — Seller Pro Subscriptions (Tuần 4–5)
- **Mục tiêu:** Phát triển mô hình kinh doanh hội viên (Monetization chính).
- **Backend:**
  - Áp dụng migration **V26** (`subscription_plans` & `user_subscriptions`).
  - Xây dựng API `/subscriptions/subscribe` sinh cổng thanh toán (Prefix mã đơn hàng: `SUB_`).
  - Triển khai `SubscriptionGuard` (Aspect/Interceptor) ở tầng Controller/Service để kiểm soát giới hạn đăng tin (Ví dụ: Gói FREE tối đa 10 tin, gói PRO tối đa 50 tin).
  - Tích hợp Cronjob quét hàng đêm (00:00) để chuyển trạng thái gói cước đã hết hạn và gửi thông báo nhắc gia hạn.
- **Frontend:**
  - Thiết kế trang `/pricing` so sánh tính năng và giới hạn giữa các gói Free và Seller Pro.
  - Tạo luồng nâng cấp tài khoản cực kỳ mượt mà, hiển thị popup upsell khi Landlord chuẩn bị vượt quá giới hạn tin đăng.

---

### Sprint 3 — Smart Price Suggestion Engine (Tuần 6)
- **Mục tiêu:** Hỗ trợ Landlord định giá phòng chuẩn xác để tăng tỷ lệ chốt cọc.
- **Backend:**
  - Áp dụng migration **V25** (`listings.room_type` + `price_benchmarks`).
  - Triển khai `PriceBenchmarkService`:
    - Tính toán giá trị trung vị P25, P50 (Median), P75 của các tin đặt cọc thành công (`RELEASED`) hoặc tin đăng active (`LISTING` fallback) trong bán kính hoặc cùng Quận/Huyện & Loại hình.
    - Chạy tự động qua `@Scheduled` lúc 2:00 AM hàng ngày để cập nhật bảng `price_benchmarks`.
  - Viết API `GET /api/v1/price-suggestion` nhận tham số: `city`, `district`, `roomType`, `area`.
- **Frontend:**
  - Trên form Đăng tin/Chỉnh sửa tin: Khi điền đủ thông tin địa chỉ và diện tích, hiển thị widget gợi ý khoảng giá lý tưởng (Xanh lá = Giá tốt, Vàng = Hơi cao, Đỏ = Rất cao so với thị trường).

---

### Sprint 4 — Advanced Geo-Search & Map Optimization (Tuần 7–8)
- **Mục tiêu:** Thay thế tính năng tìm kiếm thô bằng công cụ tìm kiếm trực quan bằng Bản đồ MapLibre.
- **Frontend Map Optimization:**
  - Tích hợp công cụ vẽ đa giác (Polygon Draw tool) cho phép người dùng tự vẽ vùng muốn tìm trọ trực tiếp trên bản đồ.
  - Tối ưu hóa render marker bằng kỹ thuật clustering (gom nhóm marker gần nhau) để tránh lag khi có hàng ngàn tin đăng.
  - Hiển thị Popup chi tiết nhanh khi click vào marker (Ảnh đại diện, Giá, Diện tích, Nút chat nhanh).
- **Backend:**
  - Nâng cấp API Search: Tiếp nhận tọa độ đa giác (danh sách Points) để query bằng điều kiện Spatial (`ST_Contains` trong Postgres Spatial/PostGIS hoặc tối ưu hóa tính toán khoảng cách).

---

### Sprint 5 — Web Notifications & Thymeleaf Email Hub (Tuần 9–10)
- **Mục tiêu:** Kênh thông báo realtime và email tin cậy thay thế cho App Push.
- **Web Push Notifications:**
  - Áp dụng migration **V27** (`web_push_subscriptions`).
  - Tích hợp thư viện WebPush Java ở Backend.
  - Viết Service Worker ở Frontend Next.js để nhận push notification và hiển thị banner ngay cả khi tắt tab ứng dụng.
- **Email Transactional Alerts:**
  - Xây dựng template HTML đẹp mắt bằng **Thymeleaf Email Template** cho các sự kiện:
    1. Người thuê gửi yêu cầu cọc trọ (Gửi Landlord).
    2. Cọc trọ được khớp thành công (Gửi cả hai).
    3. Phát sinh tranh chấp cọc (Gửi Admin & Landlord/Tenant).
    4. Cảnh báo gói Seller Pro sắp hết hạn trước 3 ngày.
  - Tách luồng gửi mail sang xử lý bất đồng bộ (`@Async` hoặc Queue) để không làm chậm luồng chính.

---

### Sprint 6 — SEO Scale (Next.js SSG/ISR) & Sitemap (Tuần 11–12)
- **Mục tiêu:** Thu hút lượng lớn traffic tự nhiên từ Google search (Không cần ngân sách marketing).
- **Next.js Routing & Dynamic Pages:**
  - Xây dựng cấu trúc Route tĩnh/động tối ưu chuẩn SEO: `/tim-phong-tro/[city]` và `/tim-phong-tro/[city]/[district]`.
  - Áp dụng cơ chế **ISR (Incremental Static Regeneration)** của Next.js để sinh tĩnh HTML cho các trang này, cấu hình revalidate mỗi 1 giờ.
  - Tích hợp dữ liệu cấu trúc Schema.org (JSON-LD) cho mỗi Listing Detail (giúp hiển thị giá, review dạng Rich Snippets trên kết quả tìm kiếm Google).
- **Backend & Sitemap:**
  - Triển khai API `/sitemap.xml` động trả về danh sách toàn bộ các tin đăng active và các trang khu vực hành chính để bot Google lập chỉ mục hàng ngày.
  - Áp dụng migration **V28** (`seo_pages`) để Admin có thể cấu hình meta title/description tùy biến cho từng trang khu vực trọng điểm.

---

### Sprint 7 — Advanced Analytics & Redis Performance Tuning (Tuần 13–14)
- **Mục tiêu:** Giảm tải hệ thống, tăng tốc độ phản hồi và cung cấp dashboard tài chính nâng cao.
- **Backend & DB Optimization:**
  - Áp dụng migration **V29** (`landlord_analytics_daily` materialized view).
  - Tích hợp Cronjob refresh materialized view hàng giờ.
  - Áp dụng Redis Caching cho:
    - Danh mục Quận/Huyện tĩnh.
    - Kết quả tìm kiếm phổ biến (Cache 5 phút).
    - Dữ liệu gợi ý khoảng giá thuê (Cache 24 giờ).
  - Viết API thống kê phễu chuyển đổi cho Landlord: `Lượt xem` -> `Nhắn tin` -> `Đặt cọc` -> `Chốt thành công`.
- **Frontend Dashboard:**
  - Cập nhật trang `/landlord/analytics` với biểu đồ phễu chuyển đổi (Funnel chart) và biểu đồ cột doanh thu theo tháng (sử dụng Recharts).
  - Dashboard tài chính tổng quan của Admin.

---

## 📐 Kiến trúc Thư mục & Công nghệ Web-First

```
RentSpace/
├── backend/src/main/java/com/rentspace/
│   ├── config/                     # Cấu hình WebPush, Mail, Redis
│   ├── controller/                 # Endpoints Payout, Subscription, Push, Analytics
│   ├── domain/
│   │   ├── payment/                # MoMoGateway, VnpayGateway, PaymentWebhookRouter
│   │   ├── payout/                 # PayoutService, PayoutRepository
│   │   ├── subscription/           # SubscriptionService, SubscriptionGuard
│   │   └── notification/           # WebPushService, EmailService (Thymeleaf templates)
│   └── scheduler/                  # PriceBenchmarkScheduler, MaterializedViewRefresher
├── frontend/src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── app/
│   │   │   ├── landlord/
│   │   │   │   ├── payouts/        # Liên kết ngân hàng & theo dõi giải ngân
│   │   │   │   ├── subscription/   # Nâng cấp gói Seller Pro
│   │   │   │   └── analytics/      # Biểu đồ phễu & doanh thu nâng cao
│   │   │   └── search/             # Bản đồ MapLibre + lọc nâng cao
│   │   └── tim-phong-tro/          # Dynamic SEO pages [city]/[district] (SSG/ISR)
│   ├── public/
│   │   └── service-worker.js       # Xử lý Web Push background
│   └── components/
│       └── maps/                   # MapLibre với Polygon Draw & Clustering
```

---

## 🧪 Định nghĩa Hoàn thành (DoD) bổ sung cho Web-First

1. **Thanh toán MoMo:** Giao dịch chạy thành công trong môi trường Sandbox, webhook xử lý bất đồng bộ, chống trùng lặp (Idempotent) qua Redis lock.
2. **Payout:** Số tài khoản ngân hàng của Landlord phải được mã hóa AES-256 dưới DB. Các lệnh rút tiền phải lưu vết audit log đầy đủ.
3. **Subscriptions:** Khi một tài khoản hết hạn gói Pro, hệ thống lập tức ẩn các tin đăng vượt quá giới hạn (ví dụ: tin thứ 11 trở đi) và gửi thông báo nhắc gia hạn.
4. **Web Push:** Đăng ký và nhận thông báo thành công trên cả Chrome, Safari, Edge (cả máy tính và điện thoại thông qua trình duyệt web).
5. **SEO & Performance:** Điểm Lighthouse cho các trang tĩnh (SEO Pages) phải đạt tối thiểu **85+** điểm SEO và Performance. Bản đồ hiển thị mượt mà với 500+ markers nhờ Clustering.

---
*Tài liệu Phase 3 v3.0 — Bản cập nhật Web-First tối ưu hóa nguồn lực solo developer.*
