# CLAUDE.md — RentSpace

Đây là hướng dẫn cho Claude Code. Đọc trước khi làm bất kỳ task nào.

---

## Dự án

**RentSpace** — Nền tảng thuê phòng trọ Việt Nam. Fullstack monorepo:
- **Backend:** Spring Boot 3.3.5 + Java 21 + PostgreSQL 16 + PostGIS + Redis
- **Frontend:** Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Framer Motion v12
- **Infra:** Docker Compose (dev) | Nginx + VPS (prod)

Tài liệu kỹ thuật đầy đủ: `.gemini/rules/project-context.md`
Coding guidelines: `.gemini/rules/coding-guidelines.md`
Ngôn ngữ & commit: `.gemini/rules/language-protocol.md`
Git workflow: `.gemini/rules/workflow.md`

---

## Quy tắc ngôn ngữ (tóm tắt)

- **Code, tên biến, commit message:** Tiếng Anh
- **Comment, Javadoc/JSDoc, error message, UI text:** Tiếng Việt
- **Claude trả lời:** Tiếng Việt

---

## Giai đoạn hiện tại — Phase 3

**Branch hiện tại:** `feature/subscription-monthly-reset`

| Sprint | Trạng thái |
|---|---|
| Sprint 0 — MoMo Payment | ✅ Done (PR #49) |
| Sprint 1 — Payout System | ✅ Done (PR #50) |
| Sprint 2 — Seller Pro Subscription | 🔄 Đang làm |
| Sprint 3 — Price Suggestion Engine | ⏳ Chưa bắt đầu |
| Sprint 4 — Geo-Search & MapLibre | ⏳ Chưa bắt đầu |
| Sprint 5 — Web Push & Email | ⏳ Chưa bắt đầu |
| Sprint 6 — SEO Scale (SSG/ISR) | ⏳ Chưa bắt đầu |
| Sprint 7 — Analytics & Redis | ⏳ Chưa bắt đầu |

Kế hoạch chi tiết: `PHASE3_CODING_PLAN.md`

---

## Quy tắc tuyệt đối (không được vi phạm)

1. Không commit secret, API key, password
2. Không disable Spring Security hoặc bỏ JWT validation
3. Không raw SQL khi JPA/JPQL xử lý được
4. Không `@Transactional` ở Controller
5. Mọi thay đổi schema DB → tạo Flyway migration mới (hiện tại đến V26, Phase 3: V23–V29)
6. Không sửa file migration đã merged
7. Không `any` type ở TypeScript
8. Mọi response backend bọc trong `ApiResponse<T>`

---

## Gotcha kỹ thuật quan trọng

**Backend:**
- `@DataJpaTest` bắt buộc thêm `@AutoConfigureTestDatabase(replace = NONE)` — project dùng PostgreSQL thật, không H2
- Class `User` gây xung đột với Spring Security — luôn dùng FQN: `com.rentspace.domain.user.User` trong test
- JSONB column mapping: dùng `@JdbcTypeCode(SqlTypes.JSON)`, không dùng String
- Geo query: `ST_DWithin` phải dùng native query (Hibernate Spatial không hỗ trợ qua JPQL)

**Frontend:**
- Next.js 16 có breaking changes — đọc `frontend/AGENTS.md` trước khi viết code
- Framer Motion v12: import từ `"framer-motion"`, KHÔNG phải `"motion/react"`
- Tailwind v4: dùng `@tailwindcss/postcss`, không dùng plugin `tailwindcss` cũ trong postcss config
- `min-h-[100dvh]` thay vì `h-screen` (iOS Safari viewport jumping)

---

## Slash commands có sẵn

| Command | Dùng khi |
|---|---|
| `/frontend` | Build UI component, page mới — anti-slop + stack RentSpace |
| `/full-output` | Implement service/component lớn — ngăn cắt code |
| `/premium-ui` | Pricing page, SEO landing, hero mới — high-end feel |
| `/crew` | Task phức tạp nhiều file — Investigator → Builder → Reviewer |
| `/backend` | Viết Controller, Service, Entity, Repository, Mapper, test |
| `/migration` | Tạo Flyway migration mới (V27+) |

---

## Quy tắc commit

- **KHÔNG** thêm `Co-Authored-By: Claude ...` vào commit message
- Commit chỉ ghi tên tác giả duy nhất là user (Leon)
- Commit message bằng tiếng Anh, theo Conventional Commits

---

## Pre-push checklist

```bash
# Backend
cd backend && ./mvnw clean compile test-compile

# Frontend  
cd frontend && npm run lint
```

Không push nếu còn compile error hoặc lint error.
