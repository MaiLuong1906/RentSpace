---
name: frontend
description: RentSpace frontend anti-slop skill. Kích hoạt khi build UI mới, redesign trang, hoặc viết component. Đọc brief → suy luận ngữ cảnh → code đúng stack.
---

# RentSpace Frontend Skill

> Áp dụng cho: landing page, trang pricing, SEO pages, maps UI, analytics dashboard, upsell popup, form flow.
> Không áp dụng cho: admin data table, debug logic backend.

---

## 0. STACK CỐ ĐỊNH (không thay đổi)

```
Framework  : Next.js 16 + React 19 (có breaking changes — đọc AGENTS.md trước)
Styling    : Tailwind CSS v4 (@tailwindcss/postcss — không dùng plugin tailwindcss cũ)
Components : shadcn/ui (Radix UI) cho main UI | antd v6 cho admin panel
Icons      : lucide-react (đã dùng toàn dự án — giữ nhất quán, không switch library)
Animation  : framer-motion v12 (import từ "framer-motion", KHÔNG phải "motion/react")
Maps       : maplibre-gl + react-map-gl
Charts     : recharts
State      : zustand + @tanstack/react-query
Forms      : react-hook-form + zod
Toast      : sonner
Theme      : next-themes
```

**Quy tắc stack:**
- Không install thêm component library mới khi shadcn/ui đã cover
- Không dùng `@tailwindcss/postcss` với config cũ — v4 dùng CSS-first config
- Client component: thêm `"use client"` khi dùng hooks, animation, event handler
- Server component: mặc định. Không fetch trong useEffect khi có thể dùng RSC
- Viewport stability: luôn `min-h-[100dvh]`, không bao giờ `h-screen`

---

## 1. SUY LUẬN BRIEF

Trước khi viết code, đọc ngữ cảnh và tuyên bố 1 dòng:

**"Đọc như: [loại trang] cho [đối tượng], ngôn ngữ [vibe], hướng tới [aesthetic]."**

Ví dụ RentSpace:
- Pricing page: "Đọc như: upsell page cho landlord Việt Nam, ngôn ngữ trust-first + value-clear, hướng tới clean SaaS với accent xanh thương hiệu."
- SEO landing: "Đọc như: SEO page tĩnh cho người tìm phòng, ngôn ngữ editorial + local, hướng tới minimal với typography rõ."
- Analytics dashboard: "Đọc như: data dashboard cho landlord, ngôn ngữ functional-clean, hướng tới density medium với Recharts."

---

## 2. BA DIAL

Sau brief, đặt 3 dial. Mọi quyết định layout/motion/density đều theo đây.

- `DESIGN_VARIANCE`: 1=đối xứng, 10=bất đối xứng
- `MOTION_INTENSITY`: 1=tĩnh, 10=cinematic
- `VISUAL_DENSITY`: 1=thoáng, 10=dày đặc

**Preset cho RentSpace:**

| Trang | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Pricing / Landing | 7 | 5 | 3 |
| SEO city pages | 6 | 3 | 4 |
| Analytics dashboard | 4 | 2 | 7 |
| Upsell popup | 6 | 4 | 3 |
| Map search UI | 5 | 3 | 6 |
| Home page | 7 | 5 | 4 |

---

## 3. DESIGN DIRECTION — RentSpace

**Màu sắc thương hiệu:**
- Primary: `blue-600` (#2563EB) — accent chính, dùng nhất quán
- Background: `#FAFAFA` hoặc `white` — không gradient hero bừa bãi
- Text: `#111827` (gray-900) — không đen thuần
- Muted: `#6B7280` (gray-500)
- Border: `#E5E7EB` (gray-200)

**ANTI-PATTERNS BỊ CẤM cho RentSpace:**
- `bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700` — hero hiện tại là slop, cần fix dần
- 3 feature card bằng nhau trong 1 hàng
- Hero căn giữa + h1 + p + 2 button (quá clichê)
- Rounded pill (`rounded-full`) cho container lớn
- Shadow nặng `shadow-lg`, `shadow-xl` — thay bằng border hoặc shadow cực nhẹ
- Gradient text cho heading
- `Inter` font nếu thêm custom font

**TYPOGRAPHY:**
- Không có custom font → dùng system font stack: `font-sans` (Tailwind default)
- Heading: `font-bold tracking-tight leading-tight`
- Display: `text-4xl md:text-5xl lg:text-6xl` — không quá 2 dòng ở desktop
- Body: `text-base text-gray-600 leading-relaxed max-w-[65ch]`
- Label/tag: `text-xs font-medium uppercase tracking-wide`

**LAYOUT:**
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section padding: `py-16 md:py-24` (không `py-32` vì content-dense)
- Card: `border border-gray-200 rounded-xl p-6` — không heavy shadow
- Grid bất đối xứng ưu tiên hơn 3-col đều nhau

---

## 4. ANIMATION — Framer Motion v12

```tsx
// Đúng — v12
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

// SAI — không tồn tại trong project này
import { motion } from "motion/react"
```

**Patterns được dùng:**
```tsx
// Scroll reveal
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>

// Stagger list
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

// Hover card
whileHover={{ y: -2, transition: { duration: 0.2 } }}
```

**Bắt buộc:** Wrap animation trong `useReducedMotion()` check. Chỉ animate `transform` và `opacity`.

**Pattern bị cấm:**
- `window.addEventListener("scroll", ...)` — dùng `IntersectionObserver` hoặc framer-motion `useScroll`
- Animate `top`, `left`, `width`, `height`
- `backdrop-blur` trên scrolling container

---

## 5. STATE & DATA FETCHING

```tsx
// Đúng — TanStack Query cho server data
const { data, isLoading } = useQuery({ queryKey: ['listings'], queryFn: fetchListings })

// Đúng — Zustand cho global UI state
const { user, setUser } = useAuthStore()

// SAI — không dùng useState để track scroll hay mouse position
// Dùng framer-motion useMotionValue/useTransform
```

---

## 6. SHADCN/UI — QUY TẮC

- Không override style bằng inline style — dùng `cn()` với Tailwind utilities
- Button variant: `default` (filled dark) | `outline` | `ghost` | `destructive`
- Dialog: dùng `<Dialog>` từ shadcn, không tự build modal
- Form: `<Form>` + `<FormField>` + zod schema — không tự validate
- Toast: `toast()` từ `sonner`, không dùng antd notification trong main UI

---

## 7. ICONS — LUCIDE REACT

```tsx
import { Search, MapPin, Home, Star, ChevronRight } from "lucide-react"

// Size chuẩn
<Icon className="h-4 w-4" />  // inline, label
<Icon className="h-5 w-5" />  // button
<Icon className="h-6 w-6" />  // card header
```

- Không tự vẽ SVG icon
- Stroke width mặc định của Lucide (2) — không override trừ khi cần
- Một icon library duy nhất: không import từ `@heroicons`, `phosphor-icons` trong cùng component

---

## 8. VIETNAMESE CONTEXT

- **Mobile-first thực sự**: người dùng Việt Nam 70%+ dùng điện thoại
- **Ngôn ngữ**: Tiếng Việt trong copy, format số `Intl.NumberFormat("vi-VN")`
- **Price display**: `{price.toLocaleString("vi-VN")}đ/tháng`
- **Trust signals**: KYC badge, verified icon quan trọng — không ẩn
- **CTA**: Ngắn gọn, action-oriented: "Đăng ký ngay", "Xem phòng", "Liên hệ chủ trọ"
- Không dùng "Elevate", "Seamless", "Next-Gen" — dùng ngôn ngữ đơn giản, cụ thể

---

## 9. AI TELL — CẤM TRONG RENTSPACE

- `from-blue-600 via-blue-700 to-purple-700` gradient (AI hero cliché #1)
- 3 card đều nhau trong feature section
- Hero tất cả căn giữa với padding top khổng lồ
- `shadow-lg` / `shadow-xl` khắp nơi
- "Tìm phòng trong giây lát" / "Kết nối không giới hạn" — copy generic
- Em-dash `—` ở bất kỳ đâu
- Avatar tròn cho tất cả người dùng (thêm squircle variant)
- Logo/badge overlay lên ảnh listing

---

## 10. PRE-FLIGHT CHECKLIST

Trước khi output code, verify:

- [ ] Brief đã tuyên bố (1 dòng)?
- [ ] Dial đã đặt từ preset RentSpace?
- [ ] Import từ đúng `"framer-motion"` (không `"motion/react"`)?
- [ ] `"use client"` có mặt khi cần?
- [ ] `min-h-[100dvh]` thay vì `h-screen`?
- [ ] Không gradient hero `blue-to-purple`?
- [ ] Không 3 feature card đều nhau?
- [ ] Không em-dash (`—`) ở bất kỳ đâu?
- [ ] Không shadow nặng (`shadow-lg`, `shadow-xl`)?
- [ ] Hero ≤ 2 dòng headline, ≤ 20 từ subtext, CTA visible?
- [ ] Price format: `toLocaleString("vi-VN")` + `đ`?
- [ ] Mobile collapse rõ ràng cho layout multi-col?
- [ ] Animation có `useReducedMotion` check?
- [ ] Không tự vẽ SVG icon?
- [ ] Không `window.addEventListener("scroll")`?
