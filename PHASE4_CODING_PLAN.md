# 🚀 Kế hoạch Code Chi Tiết — Phase 4 (Trust, Marketplace Maturity & AI Layer)
> RentSpace — Nền tảng thuê trọ | Nối tiếp Phase 3 | Thời gian: **12 tuần** (Sprints 0–7) + 2 tuần Buffer | Quy mô: Solo Developer
> **Phiên bản:** v4.0 — Giai đoạn cuối cùng có kế hoạch: hoàn thiện trust layer, marketplace core, và tích hợp AI có chọn lọc

---

## 📌 Định hướng chiến lược Phase 4

Sau Phase 3, RentSpace đã có hạ tầng kiếm tiền (payment, subscription, payout), hiệu năng (Redis, materialized view), và khả năng tiếp cận (SEO, web push). Phase 4 giải quyết **3 khoảng trống còn lại** khiến người dùng chưa tin tưởng hoàn toàn vào nền tảng:

1. **Trust gap:** Không ai biết người kia là ai — eKYC xác minh danh tính thật cho cả hai phía.
2. **Commitment gap:** Thỏa thuận chỉ qua chat, không có giá trị pháp lý — hợp đồng điện tử giải quyết điều này.
3. **Discovery gap:** Người thuê phải tự tìm, không được gợi ý — recommendation engine và AI search thu hẹp khoảng cách này.

**Nguyên tắc chọn AI:** AI agent chỉ được triển khai khi tác vụ yêu cầu hiểu ngôn ngữ tự nhiên hoặc tổng hợp đa bước. eKYC và Reviews là software engineering thuần túy, không cần AI agent.

---

## 🗺️ Lộ trình tổng quan Phase 4

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  🔐 Trust & Legal (4A)              🤖 Intelligence Layer (4B)       │
│  - eKYC CMND/CCCD verification      - Recommendation Engine (SQL→ML) │
│  - Bidirectional Reviews & Ratings  - Contract AI Assistant          │
│  - Digital Contracts + E-signature  - Semantic Search Agent          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Bảng Epic & Sprint hoàn chỉnh (14 tuần)

| Epic | Tên | Phase | Sprint | Tuần | Độ phức tạp | Milestone |
|---|---|---|---|---|---|---|
| **EP-1** | eKYC & Trust System | **4A** | Sprint 0 | 1–2 | 🟡 Trung bình | Verified badge hiển thị trên profile, block ký hợp đồng nếu chưa verify |
| **EP-2** | Bidirectional Reviews & Ratings | **4A** | Sprint 1 | 3–4 | 🟢 Thấp | Cả hai phía đánh giá sau khi deposit RELEASED |
| **EP-3** | Digital Contracts & E-signature | **4A** | Sprint 2–3 | 5–7 | 🔴 Cao | Hợp đồng được ký số, lưu trữ bất biến, email PDF cho cả hai |
| **EP-4** | Saved Listings & Interaction Tracking | **4B** | Sprint 4 | 8 | 🟢 Thấp | Wishlist, tracking hành vi người dùng cho recommendation |
| **EP-5** | Recommendation Engine | **4B** | Sprint 5 | 9–10 | 🟡 Trung bình | "Gợi ý cho bạn" và "Phòng tương tự" có dữ liệu thực |
| **EP-6** | Contract AI Assistant | **4B** | Sprint 6 | 11 | 🟡 Trung bình | Người dùng hỏi AI về điều khoản hợp đồng |
| **EP-7** | Semantic Search Agent | **4B** | Sprint 7 | 12 | 🟡 Trung bình | Tìm kiếm bằng câu hỏi tự nhiên tiếng Việt |

> **Buffer 2 tuần** (Tuần 13–14): Security audit, performance regression testing, và soft launch marketing.

---

## 🗂️ Database Schema — Flyway Migration (V32–V36)

> **Lưu ý:** Phase 3 kết thúc tại V31 (V30 = seo_pages, V31 = analytics materialized view).
> Phase 4 bắt đầu từ **V32**. Xem thêm ghi chú schema kế thừa bên dưới.

### Schema kế thừa cần biết trước khi implement

| Table cũ | Migration | Schema cũ | Quyết định Phase 4 |
|---|---|---|---|
| `reviews` | V8 | `(listing_id, tenant_id)` — one-directional | Tạo bảng **`transaction_reviews`** mới (bidirectional). Không ALTER bảng cũ. |
| `users.ekyc_*` | V14 | Columns trực tiếp trên `users` | Tạo bảng **`user_verifications`** riêng. Coexist được. `user_verifications` là source of truth mới. |
| `rental_contracts` | V17 | `contract_url` TEXT đơn giản | Tạo bảng **`contracts`** mới với state machine. Hai bảng tồn tại song song. |

```sql
-- ============================================================
-- V32: eKYC — Xác minh danh tính người dùng
-- (coexist với users.ekyc_* từ V14 — V32 là source of truth mới)
-- ============================================================
CREATE TABLE user_verifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PROCESSING', 'VERIFIED', 'REJECTED')),
    id_type         VARCHAR(20) NOT NULL DEFAULT 'CCCD'
                    CHECK (id_type IN ('CCCD', 'CMND', 'PASSPORT')),
    -- KHÔNG lưu số ID thật — chỉ lưu kết quả và ref từ provider
    masked_id       VARCHAR(20),          -- VD: "0012****5678" — chỉ để hiển thị
    full_name       VARCHAR(200),         -- Tên xác minh từ provider
    provider        VARCHAR(50) NOT NULL DEFAULT 'FPT_AI'
                    CHECK (provider IN ('FPT_AI', 'MANUAL')),
    provider_ref    VARCHAR(255),         -- ID giao dịch từ FPT.AI
    rejection_reason TEXT,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- V33: TRANSACTION REVIEWS — Đánh giá 2 chiều sau giao dịch
-- (KHÔNG dùng tên "reviews" — bảng đó đã tồn tại từ V8 với schema khác)
-- ============================================================
CREATE TABLE transaction_reviews (
    id              BIGSERIAL PRIMARY KEY,
    reviewer_id     BIGINT NOT NULL REFERENCES users(id),
    reviewee_id     BIGINT NOT NULL REFERENCES users(id),
    deposit_id      BIGINT NOT NULL REFERENCES deposit_transactions(id),
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    reviewer_role   VARCHAR(20) NOT NULL CHECK (reviewer_role IN ('TENANT', 'LANDLORD')),
    is_published    BOOLEAN DEFAULT TRUE,
    flagged         BOOLEAN DEFAULT FALSE,  -- auto-flag bởi moderation job
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(reviewer_id, deposit_id)         -- một giao dịch chỉ review 1 lần
);

CREATE INDEX idx_tx_reviews_reviewee ON transaction_reviews(reviewee_id, is_published);
CREATE INDEX idx_tx_reviews_deposit  ON transaction_reviews(deposit_id);

-- Summary cache: cập nhật sau mỗi transaction_review mới (via service, không dùng trigger)
CREATE TABLE user_rating_summary (
    user_id         BIGINT PRIMARY KEY REFERENCES users(id),
    avg_rating      DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    review_count    INTEGER NOT NULL DEFAULT 0,
    last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- V34: CONTRACTS — Hợp đồng điện tử
-- (coexist với rental_contracts từ V17 — V34 có state machine đầy đủ)
-- ============================================================
CREATE TABLE contracts (
    id              BIGSERIAL PRIMARY KEY,
    deposit_id      BIGINT NOT NULL REFERENCES deposit_transactions(id) UNIQUE,
    listing_id      BIGINT NOT NULL REFERENCES listings(id),
    landlord_id     BIGINT NOT NULL REFERENCES users(id),
    tenant_id       BIGINT NOT NULL REFERENCES users(id),
    content_html    TEXT NOT NULL,          -- bất biến sau khi FULLY_SIGNED
    content_json    JSONB,                  -- structured data để AI đọc
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_SIGNATURES','FULLY_SIGNED','CANCELLED','EXPIRED')),
    landlord_signed_at  TIMESTAMPTZ,
    tenant_signed_at    TIMESTAMPTZ,
    esign_provider      VARCHAR(50),        -- 'VNPT_ESIGN' | 'SELF_HOSTED'
    esign_document_id   VARCHAR(255),       -- ref từ provider để download PDF
    expires_at          TIMESTAMPTZ,        -- hợp đồng tự EXPIRED sau X ngày nếu chưa ký
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_landlord ON contracts(landlord_id, status);
CREATE INDEX idx_contracts_tenant   ON contracts(tenant_id, status);

-- ============================================================
-- V35: USER LISTING INTERACTIONS — Tín hiệu cho Recommendation
-- ============================================================
CREATE TABLE user_listing_interactions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT REFERENCES users(id),    -- NULL = anonymous
    session_id          VARCHAR(100),                   -- track anonymous user
    listing_id          BIGINT NOT NULL REFERENCES listings(id),
    interaction_type    VARCHAR(20) NOT NULL
                        CHECK (interaction_type IN ('VIEW','SAVE','CHAT_INIT','DEPOSIT','SHARE')),
    view_duration_sec   INTEGER,    -- chỉ có giá trị với type = VIEW
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_user    ON user_listing_interactions(user_id, created_at DESC);
CREATE INDEX idx_interactions_listing ON user_listing_interactions(listing_id, interaction_type);

-- ============================================================
-- V36: SAVED LISTINGS — Wishlist / Lưu tin yêu thích
-- ============================================================
CREATE TABLE saved_listings (
    user_id     BIGINT NOT NULL REFERENCES users(id),
    listing_id  BIGINT NOT NULL REFERENCES listings(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX idx_saved_user ON saved_listings(user_id, created_at DESC);
```

---

## 🏃 Kế hoạch Sprint Chi tiết

### Sprint 0 — eKYC & Trust System (Tuần 1–2)

**Mục tiêu:** Người dùng có thể xác minh danh tính bằng CMND/CCCD. Profile hiển thị Verified badge. Hợp đồng điện tử (Sprint 2-3) sẽ yêu cầu cả hai bên đã verified.

**Backend:**
- Migration **V32** (`user_verifications`). Coexist với `users.ekyc_*` từ V14 — `user_verifications` là source of truth mới.
- Tích hợp **FPT.AI eKYC API**: nhận ảnh mặt trước/sau CCCD + ảnh selfie → provider trả về kết quả xác minh.
- Không lưu số ID raw — chỉ lưu `masked_id`, `full_name`, `provider_ref`.
- `VerificationService`: submit ảnh lên FPT.AI, lưu kết quả, cập nhật status.
- `GET /api/v1/users/verification/status` — xem trạng thái verify của mình.
- `POST /api/v1/users/verification/submit` — upload ảnh, khởi tạo process.
- `POST /api/v1/admin/verifications/{id}/manual-review` — Admin override kết quả (ROLE_ADMIN).
- Bổ sung field `isVerified` (computed từ `user_verifications`) vào `UserSummaryDto`.

**Frontend:**
- Flow xác minh 3 bước trong `/app/profile/verify`: upload ảnh CCCD → chụp selfie → chờ kết quả.
- Verified badge (icon xanh ✓) hiển thị trên: profile page, listing card (chủ trọ), chat header, review card.
- Banner nhắc nhở verify trong dashboard nếu user chưa thực hiện.

---

### Sprint 1 — Bidirectional Reviews & Ratings (Tuần 3–4)

**Mục tiêu:** Sau khi deposit chuyển sang `RELEASED`, cả landlord và tenant đều có thể đánh giá nhau. Rating hiển thị trên profile, listing card.

**Backend:**
- Migration **V33** (`transaction_reviews`, `user_rating_summary`). Tên bảng `transaction_reviews` (không phải `reviews` — đã tồn tại từ V8 với schema khác).
- `TransactionReviewService`:
  - `submitReview(...)`: validate chỉ được review sau RELEASED, chưa review trước đó.
  - `updateRatingSummary(revieweeId)`: tính lại avg_rating + review_count, update `user_rating_summary`.
  - Background job (chạy hàng đêm): scan reviews có `flagged = true`, gửi email admin để moderation.
- `GET /api/v1/users/{userId}/reviews` — danh sách reviews của một user.
- `POST /api/v1/reviews` — nộp review (yêu cầu deposit đã RELEASED).
- `POST /api/v1/admin/reviews/{id}/unpublish` — Admin ẩn review vi phạm (ROLE_ADMIN).

**Auto-flag logic** (không cần AI agent — rule-based đủ dùng):
- Comment chứa từ ngữ trong blacklist → `flagged = true`, `is_published = false` chờ review.
- Rating 1 sao không có comment → `flagged = true` để admin xem xét.

**Frontend:**
- Modal đánh giá xuất hiện tự động 24h sau khi deposit RELEASED (chỉ hiện 1 lần).
- Trang profile: tab "Đánh giá nhận được" với star distribution chart.
- Listing card: hiển thị avg_rating + review_count của chủ trọ dưới tên.

---

### Sprint 2–3 — Digital Contracts & E-signature (Tuần 5–7)

**Mục tiêu:** Khi deposit được MATCHED, hệ thống tự động tạo hợp đồng thuê nhà từ template. Cả hai bên ký số. Hợp đồng ký xong không thể sửa, được gửi PDF qua email.

**Backend:**
- Migration **V34** (`contracts`). Coexist với `rental_contracts` từ V17 — bảng mới có state machine đầy đủ.
- `ContractTemplateService`: render HTML hợp đồng từ Thymeleaf template, điền thông tin từ listing + deposit + thông tin verify của hai bên.
- `ContractService`:
  - `generateContract(depositId)`: tự động gọi khi deposit chuyển sang MATCHED.
  - `signContract(contractId, party)`: cập nhật `landlord_signed_at` / `tenant_signed_at`, khi cả hai ký → status = `FULLY_SIGNED`, contract content bị lock (không update được).
  - `expireContracts()`: Scheduled job — hàng đêm tìm contracts PENDING_SIGNATURES quá 7 ngày → chuyển EXPIRED.
- `POST /api/v1/contracts/{id}/sign` — ký hợp đồng (yêu cầu verified).
- `GET /api/v1/contracts/{id}` — xem hợp đồng.
- `GET /api/v1/contracts/{id}/pdf` — download PDF (chỉ các bên liên quan).

**E-signature strategy:**
- **MVP (Self-hosted):** Lưu timestamp + IP + user JWT claim làm bằng chứng ký. Đủ giá trị tham chiếu, không cần tích hợp bên ngoài ngay.
- **Production:** Tích hợp **VNPT eSign API** — provider có giá trị pháp lý tại Việt Nam. Cấu hình qua `esign_provider` field để switch dễ dàng.

**Frontend:**
- Trang `/app/contracts/{id}`: hiển thị HTML hợp đồng, nút "Ký hợp đồng" (disabled nếu chưa verified).
- Confirm modal trước khi ký: "Bạn xác nhận đã đọc và đồng ý toàn bộ điều khoản?"
- Status timeline: Chờ ký của bạn → Chờ ký của đối tác → Đã ký đầy đủ.
- Badge "Có hợp đồng" trên listing card và trang deposit history.

---

### Sprint 4 — Saved Listings & Interaction Tracking (Tuần 8)

**Mục tiêu:** Xây dựng nền tảng dữ liệu hành vi người dùng, cần thiết cho recommendation engine Sprint 5. Đồng thời ra mắt tính năng Wishlist được người dùng yêu cầu nhiều.

**Backend:**
- Migration **V35 + V36** (`user_listing_interactions`, `saved_listings`).
- `InteractionTrackingService`: nhận event từ frontend, lưu vào `user_listing_interactions`. Gọi bất đồng bộ (`@Async`) để không chậm API chính.
- `SavedListingService`: toggle save/unsave, lấy danh sách đã lưu.
- `POST /api/v1/interactions` — track event (VIEW, SAVE, CHAT_INIT, SHARE).
- `GET /api/v1/saved-listings` — wishlist của user hiện tại.
- `POST /api/v1/saved-listings/{listingId}` — save/unsave toggle.

**Frontend:**
- Nút bookmark (icon tim/bookmark) trên listing card và listing detail — toggle save/unsave.
- Trang `/app/saved` — danh sách đã lưu.
- Track tự động khi user xem listing detail: gửi `VIEW` event kèm `view_duration_sec` khi user rời trang (dùng `beforeunload` hoặc Intersection Observer).

---

### Sprint 5 — Recommendation Engine (Tuần 9–10)

**Mục tiêu:** "Gợi ý cho bạn" trên trang chủ và "Phòng tương tự" trên listing detail có dữ liệu thực sự, không phải random. Triển khai 2 tầng: SQL-based trước, collaborative filtering khi đủ data.

**Backend:**
- `RecommendationService` — 3 chiến lược, áp dụng theo thứ tự:

  **Tầng 1 — Content-based (luôn có, không cần data):**
  ```sql
  -- "Phòng tương tự": cùng district + roomType + price range
  SELECT l.* FROM listings l
  WHERE l.city = :city AND l.district = :district
    AND l.room_type = :roomType
    AND l.price BETWEEN :minPrice AND :maxPrice
    AND l.id != :currentListingId AND l.status = 'ACTIVE'
  ORDER BY ABS(l.price - :targetPrice) ASC
  LIMIT 6;
  ```

  **Tầng 2 — Collaborative filtering (khi user_listing_interactions đủ data):**
  ```sql
  -- "Người xem listing này cũng xem": item-based CF thuần SQL
  SELECT uli2.listing_id, COUNT(DISTINCT uli2.user_id) AS co_view_score
  FROM user_listing_interactions uli1
  JOIN user_listing_interactions uli2
       ON uli2.user_id = uli1.user_id
      AND uli2.listing_id != uli1.listing_id
      AND uli2.interaction_type IN ('VIEW','SAVE','DEPOSIT')
  WHERE uli1.listing_id = :targetListingId
    AND uli1.interaction_type IN ('VIEW','SAVE','DEPOSIT')
  GROUP BY uli2.listing_id
  ORDER BY co_view_score DESC
  LIMIT 10;
  ```

  **Tầng 3 — Personalized (khi user đã login, có lịch sử):**
  - Lấy top 5 listings user xem nhiều nhất → lấy collaborative recommendations cho từng cái → merge, dedup, loại bỏ listings đã xem.

- `GET /api/v1/recommendations/similar/{listingId}` — "Phòng tương tự".
- `GET /api/v1/recommendations/for-you` — "Gợi ý cho bạn" (yêu cầu đăng nhập).
- Cache kết quả recommendation bằng Redis (TTL 30 phút) — key theo `listingId` hoặc `userId`.

**Frontend:**
- Section "Phòng tương tự" ở cuối trang listing detail (horizontal scroll cards).
- Section "Gợi ý cho bạn" trên trang chủ sau khi đăng nhập (thay thế hoặc bổ sung listing random hiện tại).

---

### Sprint 6 — Contract AI Assistant (Tuần 11)

**Mục tiêu:** Người dùng có thể hỏi AI về điều khoản hợp đồng bằng tiếng Việt tự nhiên. Agent chỉ trả lời trong phạm vi nội dung hợp đồng hiện tại — không làm chatbot tổng quát.

**Backend:**
- **Model:** `claude-haiku-4-5` cho phần lớn câu hỏi (giá rẻ, đủ nhanh). Fallback `claude-sonnet-4-6` nếu câu hỏi phức tạp (detect qua độ dài + từ khóa pháp lý).
- `ContractAiService`:
  - Nhận `contractId` + `question` từ user.
  - Load `content_json` từ contract (đã có cấu trúc, ngắn hơn HTML để tiết kiệm token).
  - Build system prompt với hard constraint: chỉ trả lời dựa trên nội dung hợp đồng được cung cấp.
  - Gọi Claude API, trả về câu trả lời.
  - Log `input_tokens` + `output_tokens` + `model_used` vào bảng `ai_usage_log` (tạo migration nhỏ nếu cần) để tracking chi phí.

**System prompt mẫu:**
```
Bạn là trợ lý pháp lý chuyên về hợp đồng thuê nhà tại Việt Nam.
Bạn CHỈ được trả lời câu hỏi liên quan đến hợp đồng được cung cấp dưới đây.
Nếu câu hỏi nằm ngoài phạm vi hợp đồng này, hãy từ chối lịch sự.
Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu cho người không có nền tảng pháp lý.

[NỘI DUNG HỢP ĐỒNG]
{contract_json}
```

- `POST /api/v1/contracts/{id}/ai-ask` — gửi câu hỏi, nhận trả lời (streaming preferred).
- Rate limit: tối đa 10 câu hỏi/hợp đồng/ngày để kiểm soát chi phí API.

**Frontend:**
- Panel chat nhỏ trong trang xem hợp đồng: input "Hỏi AI về hợp đồng này..."
- Streaming response (hiển thị từng từ khi AI trả lời).
- Disclaimer nhỏ: "Câu trả lời mang tính tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp."

---

### Sprint 7 — Semantic Search Agent (Tuần 12)

**Mục tiêu:** Người dùng gõ câu mô tả tự nhiên thay vì chọn filter. Agent chuyển đổi thành structured query và gọi search API hiện có — không thay thế search, chỉ là lớp NLP bổ sung.

**Backend:**
- `SemanticSearchService`:
  - Nhận `naturalLanguageQuery` (tiếng Việt).
  - Gọi Claude API với tool use — định nghĩa tool `search_listings` với các params: `city`, `district`, `minPrice`, `maxPrice`, `roomType`, `amenities[]`, `maxDistance`, `keywords`.
  - Claude extract params từ câu hỏi → gọi tool → service nhận params đã structured → gọi search API hiện có.
  - Cache kết quả extraction theo query hash (TTL 1 giờ) — cùng một câu hỏi không gọi LLM 2 lần.

**Tool definition mẫu:**
```json
{
  "name": "search_listings",
  "description": "Tìm kiếm phòng trọ theo các tiêu chí được trích xuất từ câu hỏi của người dùng",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "enum": ["Đà Nẵng", "Hà Nội", "Hồ Chí Minh"] },
      "district": { "type": "string" },
      "minPrice": { "type": "integer" },
      "maxPrice": { "type": "integer" },
      "roomType": { "type": "string", "enum": ["PHONG_TRO", "CHUNG_CU_MINI", "CHUNG_CU"] },
      "amenities": { "type": "array", "items": { "type": "string" } },
      "keywords": { "type": "string", "description": "Từ khóa bổ sung không map được vào filter" }
    }
  }
}
```

- `POST /api/v1/search/semantic` — nhận `{ query: string }`, trả về `{ extractedParams, listings[] }`.

**Frontend:**
- Search bar trên trang chính có toggle: "Lọc thủ công" ↔ "Tìm kiếm thông minh".
- Khi ở chế độ Semantic: input lớn placeholder *"Mô tả phòng bạn muốn thuê..."*
- Hiển thị extracted params dưới dạng tags để user xác nhận/chỉnh sửa trước khi search.

---

## 📐 Kiến trúc thư mục bổ sung Phase 4

```
backend/src/main/java/com/rentspace/
├── domain/
│   ├── verification/           # VerificationService, UserVerification entity
│   ├── review/                 # ReviewService, Review entity, RatingSummary
│   ├── contract/               # ContractService, ContractTemplateService, Contract entity
│   ├── recommendation/         # RecommendationService (content-based + CF)
│   └── ai/
│       ├── contract/           # ContractAiService (Claude API wrapper)
│       └── search/             # SemanticSearchService (tool use)
├── scheduler/
│   └── ContractExpiryScheduler.java
└── config/
    └── AnthropicConfig.java    # Claude API client config

frontend/src/
├── app/app/
│   ├── profile/verify/         # eKYC flow (3 bước upload)
│   ├── contracts/[id]/         # Xem hợp đồng + AI Assistant panel
│   └── saved/                  # Wishlist page
├── components/
│   ├── trust/
│   │   ├── VerifiedBadge.tsx
│   │   └── RatingStars.tsx
│   ├── recommendation/
│   │   ├── SimilarListings.tsx
│   │   └── ForYouSection.tsx
│   └── ai/
│       ├── ContractAiPanel.tsx # Chat UI trong trang contract
│       └── SemanticSearchBar.tsx
```

---

## 🔒 Quy tắc tuyệt đối Phase 4 (bổ sung, không thay thế Phase 3)

1. **Không lưu số CMND/CCCD raw** — chỉ lưu `masked_id`, `full_name`, `provider_ref`. Số ID thật ở phía FPT.AI, không ở DB RentSpace.
2. **Hợp đồng FULLY_SIGNED là immutable** — không được update `content_html`, `content_json` sau khi đạt trạng thái này. Enforce ở service layer, throw exception nếu vi phạm.
3. **AI agent phải có scope cứng** — system prompt phải có câu từ chối rõ ràng cho câu hỏi ngoài domain. Không biến AI assistant thành chatbot tổng quát.
4. **Track chi phí Claude API** — log `input_tokens`, `output_tokens`, `model_used`, `latency_ms` cho mỗi AI call. Alert khi vượt ngưỡng hàng ngày.
5. **eKYC không dùng AI agent** — chỉ là API call + state machine. Không wrapped thêm LLM không cần thiết.

---

## 🧪 Định nghĩa Hoàn thành (DoD) Phase 4

1. **eKYC:** Verified badge hiển thị đúng trên profile và listing card. Người dùng chưa verify không thể ký hợp đồng (UI disable + API 403).
2. **Reviews:** Sau khi deposit RELEASED, cả hai bên đều nhận notification nhắc đánh giá. Rating summary cập nhật ngay sau khi review được submit.
3. **Contracts:** Hợp đồng tự tạo sau MATCHED. Khi cả hai ký, cả hai nhận email kèm link download PDF. Hợp đồng chưa ký sau 7 ngày tự EXPIRED.
4. **Recommendation:** Section "Gợi ý cho bạn" trả về listing có liên quan (không phải random). Có thể validate bằng cách kiểm tra thủ công 10 case.
5. **Contract AI:** Trả lời đúng câu hỏi về điều khoản hợp đồng trong < 3 giây. Từ chối lịch sự câu hỏi ngoài phạm vi hợp đồng.
6. **Semantic Search:** Câu *"tìm phòng dưới 3 triệu gần Đại học Bách Khoa Hà Nội"* → extract đúng `city=Hà Nội`, `maxPrice=3000000`, `keywords=gần Đại học Bách Khoa`.

---

## 💡 Sau Phase 4 — Không có Phase 5

Phase 4 là giai đoạn có kế hoạch cuối cùng. Sau đây là chế độ **continuous improvement**:

- Đo lường thực tế: funnel conversion, recommendation click-through rate, AI usage cost.
- Iterate dựa trên user feedback thay vì roadmap định sẵn.
- Mở rộng địa bàn (tier 2 cities) nếu business demand xuất hiện.
- Nâng cấp AI models khi Anthropic release phiên bản mới có hiệu năng/giá tốt hơn.

---

*Tài liệu Phase 4 v4.0 — Trust, Marketplace Maturity & AI Layer. Giai đoạn có kế hoạch cuối cùng của RentSpace.*
