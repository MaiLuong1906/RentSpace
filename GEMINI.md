---
trigger: always_on
---

# 🗺️ GEMINI.md — Bản Đồ Hướng Dẫn AI Agent (RentSpace)

> **Dành cho AI Agent:** Đây là điểm bắt đầu bắt buộc. Đọc file này TRƯỚC KHI thực hiện bất kỳ tác vụ nào trong dự án.

---

## 📌 Giới Thiệu Dự Án

**RentSpace** là nền tảng cho thuê không gian trực tuyến tại Việt Nam, kết nối chủ nhà (Landlord) và người thuê (Tenant). Hệ thống bao gồm:

- 🔑 Xác thực & phân quyền (JWT + Spring Security + NextAuth)
- 🏠 Quản lý listing bất động sản (tìm kiếm, lọc theo vị trí địa lý)
- 📋 Quy trình KYC cho chủ nhà
- 💬 Nhắn tin thời gian thực (WebSocket/STOMP)
- 📧 Thông báo qua Email
- 🗺️ Tích hợp bản đồ Mapbox

---

## 🗂️ Cấu Trúc Quy Tắc AI (Rules Index)

| File | Mô tả | Độ ưu tiên |
|---|---|---|
| `.gemini/rules/project-context.md` | Stack công nghệ, kiến trúc hệ thống, cấu trúc thư mục | 🔴 BẮT BUỘC |
| `.gemini/rules/coding-guidelines.md` | Quy chuẩn viết code, design patterns, anti-patterns | 🔴 BẮT BUỘC |
| `.gemini/rules/language-protocol.md` | Quy định ngôn ngữ, commit message, tài liệu | 🟡 QUAN TRỌNG |
| `.gemini/rules/workflow.md` | Branching strategy, PR process, release & hotfix flow | 🟡 QUAN TRỌNG |
| `.gemini/rules/design.md` | Triết lý thiết kế UI/UX, component system | 🟡 QUAN TRỌNG |

---

## 🤖 Danh Sách AI Agents

| Agent | File | Khi nào kích hoạt |
|---|---|---|
| **Code Reviewer** | `.gemini/agents/reviewer.md` | Trước khi tạo PR / sau khi hoàn thiện tính năng |
| **Backend Guardian** | `.gemini/agents/backend-guardian.md` | Khi thêm API endpoint, sửa Security, tối ưu query |
| **Frontend Architect** | `.gemini/agents/frontend-architect.md` | Khi tạo component mới, cấu trúc page, state management |
| **DB Migration Expert** | `.gemini/agents/db-migration-expert.md` | Khi thêm/sửa Flyway migration, thay đổi schema |

---

## 📅 Giai Đoạn Hiện Tại — Phase 3

**Branch hiện tại:** `feature/subscription-monthly-reset`

| Sprint | Trạng thái |
|---|---|
| Sprint 0 — MoMo Payment | ✅ Done (PR #49) |
| Sprint 1 — Payout System | ✅ Done (PR #50) |
| Sprint 2 — Seller Pro Subscription | ✅ Done |
| Sprint 3 — Price Suggestion Engine | ⏳ Chưa bắt đầu |
| Sprint 4 — Geo-Search & MapLibre | ⏳ Chưa bắt đầu |
| Sprint 5 — Web Push & Email | ⏳ Chưa bắt đầu |
| Sprint 6 — SEO Scale (SSG/ISR) | ⏳ Chưa bắt đầu |
| Sprint 7 — Analytics & Redis | ⏳ Chưa bắt đầu |

Kế hoạch chi tiết: `PHASE3_CODING_PLAN.md`

---

## ⚡ Quy Trình Làm Việc Chuẩn (Developer Workflow)

```
[Nhận task] → Đọc project-context.md → Đọc coding-guidelines.md
     ↓
[Viết code] → Tuân thủ language-protocol.md (comment tiếng Việt, code tiếng Anh)
     ↓
[Kiểm tra] → LUÔN LUÔN chạy Validation nội bộ (Lint & Tests) trước khi commit
     ↓
[Hoàn thiện] → Chạy reviewer.md checklist → Kích hoạt agent chuyên biệt
     ↓
[Commit] → Tuân thủ Conventional Commits (feat/fix/chore...)
     ↓
[Push] → CI/CD pipeline tự động chạy (.github/workflows/ci-cd.yml)
```

### 🔍 Bước Kiểm Tra Bắt Buộc (Mandatory Pre-push Validation)
Trước khi push code, AI Agent và Developer **PHẢI** thực hiện:
1. **Backend**: `cd backend && ./mvnw clean compile test-compile` (Đảm bảo không lỗi compilation/tests).
2. **Frontend**: `cd frontend && npm run lint` (Đảm bảo không lỗi ESLint/TypeScript).
3. **Tuyệt đối không push** nếu còn lỗi compilation hoặc linting (errors).

### 🛠️ Lưu Ý Kỹ Thuật Quan Trọng (Critical Technical Notes)

#### **Backend:**
- **Database Testing**: LUÔN LUÔN dùng `@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)` khi sử dụng `@DataJpaTest` để tránh lỗi do Spring cố gắng tìm DB nhúng (H2). Dự án sử dụng PostgreSQL cho cả testing.
- **Ambiguity Fix**: Tránh nhầm lẫn giữa `com.rentspace.domain.user.User` và class `User` của thư viện khác (như Spring Security). Trong các file Test hoặc Logic phức tạp, LUÔN LUÔN dùng **Fully Qualified Name** (tên đầy đủ package) để tránh lỗi biên dịch trên môi trường CI.
- **JSONB Mapping**: Khi mapping cột kiểu `jsonb` từ Postgres vào Java Entity, LUÔN LUÔN dùng `@JdbcTypeCode(SqlTypes.JSON)` để tránh lỗi cast dữ liệu.
- **Flyway Rules**: Tuyệt đối **KHÔNG chỉnh sửa nội dung** các file migration đã push (merged). Nếu cần thay đổi schema, hãy tạo file migration mới (VD: `V27`).
- **Geo query**: `ST_DWithin` phải dùng native query (Hibernate Spatial không hỗ trợ qua JPQL).

#### **Frontend:**
- **Next.js 16**: Có breaking changes — đọc `frontend/AGENTS.md` trước khi viết code.
- **Framer Motion v12**: Import từ `"framer-motion"`, KHÔNG phải `"motion/react"`.
- **Tailwind v4**: Dùng `@tailwindcss/postcss`, không dùng plugin `tailwindcss` cũ trong postcss config.
- **Viewport stability**: Luôn dùng `min-h-[100dvh]` thay vì `h-screen` để tránh bị nhảy layout trên iOS Safari viewport.
- **Frontend Types**: Tuyệt đối **KHÔNG dùng `any`**. Luôn định nghĩa Interface/Type trong thư mục `src/types`. Nếu là Entity mới, hãy cập nhật vào `phase2.types.ts`.

---

## 🚨 Quy Tắc Tuyệt Đối (Non-Negotiable Rules)

1. **KHÔNG BAO GIỜ** commit secret, password, API key lên Git.
2. **KHÔNG BAO GIỜ** disable Spring Security hoặc bỏ qua JWT validation.
3. **KHÔNG BAO GIỜ** viết raw SQL khi JPA/JPQL có thể xử lý được.
4. **KHÔNG BAO GIỜ** dùng `@Transactional` ở tầng Controller.
5. **LUÔN LUÔN** validate input ở tầng Service và dùng `@Valid` ở Controller.
6. **LUÔN LUÔN** trả response theo chuẩn `ApiResponse<T>` wrapper.
7. **LUÔN LUÔN** tạo Flyway migration khi thay đổi schema database (hiện tại đến V26, Phase 3: V23-V29).
8. **KHÔNG BAO GIỜ** viết code cắt ngắn bằng các placeholder (như `// ...` hay `// TODO`) khi người dùng yêu cầu implementation đầy đủ.

---

## 📝 Quy Tắc Commit

- **KHÔNG** thêm `Co-Authored-By: Claude ...` hoặc các thông tin AI tự động khác vào commit message.
- Commit chỉ ghi tên tác giả duy nhất là user (Leon).
- Commit message bằng tiếng Anh, tuân thủ chặt chẽ Conventional Commits.

---

## 📁 Điểm Vào Nhanh (Quick Navigation)

```
RentSpace/
├── backend/src/main/java/com/rentspace/
│   ├── controller/     # REST API endpoints
│   ├── service/        # Business logic
│   ├── repository/     # JPA repositories
│   ├── entity/         # JPA entities
│   ├── dto/            # Request/Response DTOs
│   ├── security/       # JWT, Spring Security config
│   └── config/         # App configurations
├── frontend/src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utilities, API clients
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # Zustand state stores
│   └── types/          # TypeScript type definitions
├── .gemini/            # AI Agent configuration (đây rồi!)
└── .github/workflows/  # CI/CD pipelines
```
