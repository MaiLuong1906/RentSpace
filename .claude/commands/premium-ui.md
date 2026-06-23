---
name: premium-ui
description: Dùng khi build trang cần cảm giác high-end: trang /pricing, SEO landing pages /tim-phong-tro/[city], upsell popup, hero section mới. Nâng cấp lên premium so với UI hiện tại của RentSpace.
---

# RentSpace Premium UI Skill

Dùng khi trang cần cảm giác "platform đáng tin, xứng giá tiền" — đặc biệt cho:
- `/pricing` — trang so sánh gói Free vs Seller Pro
- `/tim-phong-tro/[city]/[district]` — SEO landing pages
- Upsell popup khi landlord vượt giới hạn
- Hero section mới thay thế gradient xanh-tím hiện tại

---

## AESTHETIC TARGET

RentSpace phải trông như: **nền tảng bất động sản tin cậy, người Việt dùng được, không phải startup Silicon Valley**.

Không phải: Awwwards experimental, brutalist, dark terminal.
Không phải: Cheap SaaS với gradient tím.
Phải là: Clean, trustworthy, Vietnamese-premium.

**Visual archetype:** Soft Structuralism — background trắng/off-white, typography đậm rõ, component nổi với ambient shadow mềm, accent blue nhất quán.

---

## BẢNG MÀU PREMIUM

```css
/* Background */
--bg-base:     #FAFAFA;  /* off-white ấm, không trắng thuần */
--bg-surface:  #FFFFFF;  /* card surface */
--bg-subtle:   #F3F4F6;  /* section alternate */

/* Text */
--text-primary:  #111827; /* gray-900, không #000 */
--text-muted:    #6B7280; /* gray-500 */
--text-subtle:   #9CA3AF; /* gray-400 */

/* Brand */
--brand-primary: #2563EB; /* blue-600 — accent DUY NHẤT */
--brand-light:   #EFF6FF; /* blue-50 — badge background */
--brand-medium:  #DBEAFE; /* blue-100 — highlight */

/* Border */
--border-default: #E5E7EB; /* gray-200 */
--border-strong:  #D1D5DB; /* gray-300 */

/* Success / Warning / Error */
--success: #059669; /* emerald-600 */
--warning: #D97706; /* amber-600 */
--error:   #DC2626; /* red-600 */
```

**Quy tắc:**
- Không gradient background trừ khi có lý do rõ (VD: hero hình ảnh full-bleed)
- Không màu accent thứ hai (không tím, không xanh lá cạnh blue-600)
- Light mode toàn trang — không mixed dark section

---

## TYPOGRAPHY PREMIUM

```tsx
// Display heading (hero, pricing title)
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-gray-900">

// Section heading
<h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">

// Card title
<h3 className="text-lg font-semibold text-gray-900">

// Body
<p className="text-base text-gray-600 leading-relaxed max-w-[65ch]">

// Label / eyebrow (dùng ít — tối đa 1 per 3 section)
<span className="text-xs font-semibold uppercase tracking-widest text-blue-600">

// Price display
<span className="text-4xl font-bold text-gray-900">99.000đ</span>
<span className="text-sm text-gray-500">/tháng</span>
```

---

## COMPONENT PATTERNS

### Pricing Card (Seller Pro)
```tsx
// FREE tier — subtle
<div className="border border-gray-200 rounded-2xl p-8 bg-white">

// PRO tier — elevated, highlighted
<div className="border-2 border-blue-600 rounded-2xl p-8 bg-white relative">
  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
    <span className="bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
      Phổ biến nhất
    </span>
  </div>
```

### Feature comparison row
```tsx
// Không dùng 3 card đều nhau — dùng table comparison hoặc feature list
<div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-0">
  <div className="py-3 border-b border-gray-100 text-sm text-gray-700">Số tin đăng</div>
  <div className="py-3 border-b border-gray-100 text-center text-sm">10</div>
  <div className="py-3 border-b border-gray-100 text-center text-sm font-semibold text-blue-600">50</div>
```

### Upsell popup
```tsx
// Dialog từ shadcn — khi cần block action (limit reached)
<Dialog open={limitReached} onOpenChange={() => {}}>
  <DialogContent className="sm:max-w-[420px] rounded-3xl p-0">
    // Content ngắn gọn, CTA rõ, không cho đóng (force upgrade)
```

> Sheet `side="bottom"` phù hợp cho upsell tùy chọn (người dùng có thể đóng). Dialog không đóng được phù hợp khi hard-block (đã đạt limit).

### Trust badge
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
  <Shield className="h-4 w-4 text-blue-600" />
  <span className="text-xs font-medium text-blue-700">Được xác thực KYC</span>
</div>
```

---

## HERO SECTION MỚI (thay gradient xanh-tím)

Thay vì gradient, dùng:

**Option A — Clean white với illustration/screenshot:**
```tsx
<section className="bg-white border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">
      <div>
        <h1>...</h1>
        <p>...</p>
        <CTAButtons />
      </div>
      <div className="hidden lg:block">
        <AppScreenshot />
      </div>
    </div>
  </div>
</section>
```

**Option B — Subtle blue tint (trust signal):**
```tsx
<section className="bg-blue-600">
  // Text trắng, image bên phải, không gradient sang purple
```

---

## SHADOW & DEPTH

```tsx
// Card hover — cực nhẹ
hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]

// Elevated card (featured plan)
shadow-[0_8px_24px_rgba(37,99,235,0.12)]

// Không dùng: shadow-lg, shadow-xl, shadow-2xl
```

---

## ANIMATION — Framer Motion v12

```tsx
import { motion } from "framer-motion"

// Section reveal
<motion.div
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>

// Pricing card hover
<motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>

// Stagger feature list
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}
```

---

## SEO LANDING PAGES — `/tim-phong-tro/[city]`

```tsx
// ISR với revalidate
export const revalidate = 3600 // 1 giờ

// Metadata động
export async function generateMetadata({ params }) {
  return {
    title: `Phòng trọ tại ${params.city} | RentSpace`,
    description: `Tìm phòng trọ ${params.city} uy tín, giá tốt. Xác thực KYC, review chân thực.`
  }
}

// Structured data (JSON-LD)
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...
  })}
</script>
```

---

## PRE-FLIGHT — PREMIUM UI

- [ ] Không gradient `from-blue-600 to-purple-700`?
- [ ] Accent chỉ `blue-600` — không màu thứ hai?
- [ ] Heading tracking-tight, không letter-spacing rộng?
- [ ] Shadow nhẹ custom, không `shadow-lg`?
- [ ] PRO plan có visual highlight rõ (border-2 + badge)?
- [ ] Trust signal (KYC, xác thực) hiện ở vị trí nổi?
- [ ] Price format `toLocaleString("vi-VN")` + `đ/tháng`?
- [ ] Import `framer-motion` đúng (không `motion/react`)?
- [ ] SEO pages có `generateMetadata` + JSON-LD?
- [ ] Mobile layout collapse đúng?
