# CLAUDE.md — Frontend

Bổ sung cho root `CLAUDE.md`. Đọc khi làm việc trong thư mục `frontend/`.

---

## Stack cố định

```
Next.js 16 + React 19        → có breaking changes, xem AGENTS.md
Tailwind v4                  → @tailwindcss/postcss (không dùng plugin cũ)
shadcn/ui (Radix UI)         → main UI components
antd v6                      → chỉ dùng cho admin panel
Framer Motion v12            → import từ "framer-motion" (KHÔNG "motion/react")
lucide-react                 → icon library duy nhất của project
TanStack Query v5            → server state
Zustand v5                   → client UI state
React Hook Form + Zod v4     → forms + validation
Sonner                       → toast notifications
next-themes                  → dark/light mode
MapLibre GL + react-map-gl   → bản đồ
Recharts v3                  → charts
```

---

## Cấu trúc app

```
src/app/
├── app/                     # Authenticated routes
│   ├── page.tsx             # Home (listings feed)
│   ├── search/              # Search + map
│   ├── listings/[id]/       # Listing detail
│   ├── landlord/
│   │   ├── create-listing/  # Create form
│   │   ├── edit-listing/    # Edit form
│   │   ├── my-listings/     # Landlord dashboard
│   │   ├── subscription/    # Sprint 2 🔄
│   │   ├── payout/          # Sprint 1 ✅
│   │   └── analytics/       # Sprint 7
│   ├── admin/               # Admin panel (dùng antd)
│   ├── deposits/            # Deposit management
│   └── checkout/[id]/       # Payment flow
├── auth/                    # Login, register, forgot-password
├── pricing/                 # Sprint 2 🔄 — /pricing public page
└── tim-phong-tro/           # Sprint 6 — SEO landing pages [city]/[district]

src/components/
├── ui/                      # shadcn/ui primitives (không sửa trực tiếp)
├── listing/                 # Listing-specific components
├── chat/                    # Chat components
├── community/               # Community feed
├── notification/            # Notification dropdown
└── review/                  # Review components

src/hooks/                   # Custom hooks (useListings, useAuth, ...)
src/lib/
├── api.ts                   # Axios instance với JWT interceptors
└── utils.ts                 # cn(), formatPrice(), ...
src/stores/                  # Zustand stores
src/types/                   # TypeScript interfaces
```

---

## Patterns bắt buộc

```tsx
// Data fetching — React Query, không useEffect
const { data, isLoading } = useQuery({
  queryKey: ['listings', filters],
  queryFn: () => listingApi.getAll(filters),
})

// API calls — dùng instance đã config, không axios trực tiếp
import { apiClient } from '@/lib/api'

// Forms — React Hook Form + Zod
const schema = z.object({ price: z.number().positive() })
const form = useForm({ resolver: zodResolver(schema) })

// Price format — bắt buộc
price.toLocaleString("vi-VN") + "đ"

// Client component — khi dùng hooks/events/animation
"use client"

// Viewport height — không h-screen
min-h-[100dvh]
```

---

## Slash commands cho frontend tasks

- `/frontend` — Anti-slop skill, stack RentSpace, pre-flight checklist
- `/premium-ui` — Pricing page, SEO pages, hero section mới
- `/full-output` — Khi implement component lớn, tránh cắt code

---

## Phase 3 — Frontend targets

| Sprint | File cần tạo |
|---|---|
| Sprint 2 | `app/pricing/page.tsx`, upsell popup trong `landlord/create-listing/` |
| Sprint 3 | Widget price suggestion trong create/edit listing form |
| Sprint 4 | Nâng cấp `app/search/` — MapLibre polygon draw + clustering |
| Sprint 6 | `app/tim-phong-tro/[city]/page.tsx` + `[city]/[district]/page.tsx` (ISR) |
| Sprint 7 | Nâng cấp `landlord/analytics/` — funnel chart + revenue chart (Recharts) |
