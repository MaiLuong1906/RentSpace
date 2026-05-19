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

## ⚡ Quy Trình Làm Việc Chuẩn (Developer Workflow)

```
[Nhận task] → Đọc project-context.md → Đọc coding-guidelines.md
     ↓
[Viết code] → Tuân thủ language-protocol.md (comment tiếng Việt, code tiếng Anh)
     ↓
[Hoàn thiện] → Chạy reviewer.md checklist → Kích hoạt agent chuyên biệt
     ↓
[Commit] → Tuân thủ Conventional Commits (feat/fix/chore...)
     ↓
[Push] → CI/CD pipeline tự động chạy (.github/workflows/ci-cd.yml)
```

---

## 🚨 Quy Tắc Tuyệt Đối (Non-Negotiable Rules)

1. **KHÔNG BAO GIỜ** commit secret, password, API key lên Git
2. **KHÔNG BAO GIỜ** disable Spring Security hoặc bỏ qua JWT validation
3. **KHÔNG BAO GIỜ** viết raw SQL khi JPA/JPQL có thể xử lý được
4. **KHÔNG BAO GIỜ** dùng `@Transactional` ở tầng Controller
5. **LUÔN LUÔN** validate input ở tầng Service và dùng `@Valid` ở Controller
6. **LUÔN LUÔN** trả response theo chuẩn `ApiResponse<T>` wrapper
7. **LUÔN LUÔN** tạo Flyway migration khi thay đổi schema database

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
