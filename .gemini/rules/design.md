# 🎨 Design Guidelines — RentSpace Frontend

> Triết lý và quy chuẩn thiết kế UI/UX cho toàn bộ Frontend (Next.js + TailwindCSS v4 + Shadcn UI).

---

## 1. Triết Lý Thiết Kế

**RentSpace** hướng tới trải nghiệm **tin cậy, sạch sẽ và hiện đại** — giúp người dùng Việt Nam tìm kiếm và đăng tin cho thuê một cách dễ dàng nhất.

Các giá trị thiết kế cốt lõi:
- **Clarity:** Thông tin rõ ràng, hierarchy rõ ràng, không gây nhầm lẫn
- **Trust:** Màu sắc chuyên nghiệp, layout nhất quán, feedback rõ ràng
- **Speed:** UI responsive, skeleton loading, optimistic updates
- **Accessibility:** Tương thích keyboard navigation, contrast đủ tiêu chuẩn WCAG AA

---

## 2. Hệ Thống Màu Sắc (Color System - Premium)

RentSpace áp dụng mô hình thẩm mỹ **Soft Structuralism** — sử dụng background trắng/off-white ấm áp, typography đậm và rõ ràng, các component nổi với ambient shadow cực kỳ mềm mại, và màu xanh thương hiệu làm điểm nhấn (accent) nhất quán.

Dự án sử dụng **TailwindCSS v4** với CSS custom properties. Các mã màu Premium:

```css
/* Background */
--bg-base:     #FAFAFA;  /* off-white ấm, không dùng trắng tinh cho background chính */
--bg-surface:  #FFFFFF;  /* card surface */
--bg-subtle:   #F3F4F6;  /* background cho section xen kẽ */

/* Text */
--text-primary:  #111827; /* gray-900, tránh đen thuần (#000) */
--text-muted:    #6B7280; /* gray-500 */
--text-subtle:   #9CA3AF; /* gray-400 */

/* Brand */
--brand-primary: #2563EB; /* blue-600 — màu nhấn (accent) DUY NHẤT */
--brand-light:   #EFF6FF; /* blue-50 — nền cho trust badge */
--brand-medium:  #DBEAFE; /* blue-100 — highlight và focus border */

/* Border & Shadow */
--border-default: #E5E7EB; /* gray-200 */
--border-strong:  #D1D5DB; /* gray-300 */

/* Status Colors */
--success: #059669; /* emerald-600 — Trạng thái KYC Verified, active subscription */
--warning: #D97706; /* amber-600 — Cảnh báo limit */
--error:   #DC2626; /* red-600 — Lỗi hoặc destructive action */
```

### Quy tắc dùng màu:
- **Không phối hợp gradient background bừa bãi** (đặc biệt là gradient tím-xanh ở hero section).
- **Không dùng màu accent thứ hai** (không phối xanh lá, tím, hay cam cạnh xanh dương thương hiệu `blue-600`).
- **Light mode toàn trang** — tránh pha trộn các section tối (dark section) trong bố cục tổng thể.

---

## 3. Typography Premium

Font stack chính thức của dự án:
```css
font-family: 'Inter', 'Be Vietnam Pro', system-ui, sans-serif;
/* Be Vietnam Pro được ưu tiên cho copy tiếng Việt để tối ưu hiển thị dấu */
```

### Scale Typography trong JSX:

- **Display heading (Hero page, Pricing title):**
  ```tsx
  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-gray-900">
  ```
- **Section heading (H2):**
  ```tsx
  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
  ```
- **Card title (H3):**
  ```tsx
  <h3 className="text-lg font-semibold text-gray-900">
  ```
- **Body copy:**
  ```tsx
  <p className="text-base text-gray-600 leading-relaxed max-w-[65ch]">
  ```
- **Label / Eyebrow (dùng tối giản):**
  ```tsx
  <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
  ```
- **Price display (định dạng tiếng Việt):**
  ```tsx
  <span className="text-4xl font-bold text-gray-900">
    {price.toLocaleString("vi-VN")}đ
  </span>
  <span className="text-sm text-gray-500">/tháng</span>
  ```

---

## 4. Component System (Shadcn UI)

### 4.1 Nguyên Tắc Dùng Component

```typescript
// ✅ LUÔN dùng Shadcn UI components thay vì tự build từ đầu
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// ✅ Extend Shadcn components khi cần custom behavior
export function PriceInput({ ...props }: InputProps) {
  return (
    <div className="relative">
      <Input className="pl-10" {...props} />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₫</span>
    </div>
  );
}

// ❌ Tránh tự viết modal/dialog từ đầu
// ❌ Tránh dùng inline style, ưu tiên Tailwind class
```

### 4.2 Premium Component Patterns (RentSpace Specific)

#### Pricing Cards (Gói Free vs Seller Pro)
```tsx
// FREE Tier — Subtle border, clean background
<div className="border border-gray-200 rounded-2xl p-8 bg-white transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
  <h3>Gói Cơ Bản</h3>
  {/* Content */}
</div>

// PRO Tier (Seller Pro) — Elevated, highlighted border & badge
<div className="border-2 border-blue-600 rounded-2xl p-8 bg-white relative transition-all shadow-[0_8px_24px_rgba(37,99,235,0.12)]">
  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
    <span className="bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
      Phổ biến nhất
    </span>
  </div>
  <h3>Seller Pro</h3>
  {/* Content */}
</div>
```

#### Feature Comparison Row (Bảng so sánh tính năng - Tránh grid 3 cột đều nhau)
```tsx
// Table-like row layout
<div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 py-3 border-b border-gray-100 items-center">
  <div className="text-sm text-gray-700">Số lượng tin đăng tối đa</div>
  <div className="text-center text-sm text-gray-500 w-24">10 tin</div>
  <div className="text-center text-sm font-semibold text-blue-600 w-24">50 tin</div>
</div>
```

#### Upsell Popup (Khi landlord vượt giới hạn)
```tsx
// Dùng Dialog từ Shadcn UI. Khi cần hard-block (đạt giới hạn), khóa nút Close bên ngoài.
<Dialog open={limitReached} onOpenChange={() => {}}>
  <DialogContent className="sm:max-w-[420px] rounded-3xl p-6" interactOutsideBehavior="close">
    <div className="text-center">
      <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <TrendingUp className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold mb-2">Đạt giới hạn tin đăng</h3>
      <p className="text-sm text-gray-500 mb-6">Nâng cấp gói Seller Pro để tiếp tục đăng thêm tin và tiếp cận 10,000+ khách thuê tiềm năng.</p>
      <div className="flex flex-col gap-2">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          Nâng cấp ngay
        </Button>
        <Button variant="ghost" className="w-full text-gray-500" onClick={handleClose}>
          Để sau
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

#### Trust Badge (KYC Verified)
```tsx
// Hiển thị trạng thái xác thực uy tín
<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
  <span className="text-xs font-semibold uppercase tracking-wide">Đã xác minh KYC</span>
</div>
```

---

### 4.2 Bộ Component Ưu Tiên

| Chức năng | Component | Package |
|---|---|---|
| Nút bấm | `Button` | Shadcn |
| Ô nhập liệu | `Input`, `Textarea` | Shadcn |
| Form | `Form` + React Hook Form | Shadcn |
| Modal/Popup | `Dialog` | Shadcn |
| Toast/Notification | `Sonner` | sonner |
| Loading skeleton | `Skeleton` | Shadcn |
| Dropdown | `DropdownMenu`, `Select` | Shadcn |
| Navigation | `NavigationMenu` | Shadcn |
| Table | `Table` | Shadcn |
| Date picker | `Calendar` + `react-day-picker` | Shadcn |
| Chart | `Recharts` | recharts |
| Avatar | `Avatar` | Shadcn |
| Badge | `Badge` | Shadcn |
| Carousel | `Embla Carousel` | embla-carousel-react |
| Map | `react-map-gl` + Mapbox | react-map-gl |
| Animation | `Framer Motion` | framer-motion |

---

## 5. Layout & Spacing

### 5.1 Container

```typescript
// ✅ Container chuẩn
<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
```

### 5.2 Grid System

```typescript
// ✅ Listing grid — responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

// ✅ Dashboard layout — sidebar + content
<div className="grid grid-cols-[240px_1fr] gap-8 min-h-screen">
```

### 5.3 Spacing Scale

Luôn dùng Tailwind spacing scale (bội số 4px):
- `gap-2` (8px) — Khoảng cách nhỏ giữa các element nhỏ
- `gap-4` (16px) — Khoảng cách chuẩn
- `gap-6` (24px) — Khoảng cách card grid
- `p-4` (16px) — Padding card
- `p-6` (24px) — Padding section
- `mb-8` (32px) — Margin section header

---

## 6. Responsive Design

```typescript
// ✅ Mobile-first approach
// Viết cho mobile trước, rồi override cho màn hình lớn hơn
<div className="
  flex flex-col       {/* mobile: stack dọc */}
  md:flex-row         {/* tablet+: nằm ngang */}
  gap-4
">
```

### Breakpoints (TailwindCSS v4)

| Prefix | Min-width | Device |
|---|---|---|
| (default) | 0px | Mobile |
| `sm:` | 640px | Tablet nhỏ |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop nhỏ |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Desktop lớn |

---

## 7. Animation & Micro-interactions (Framer Motion v12)

### 7.1 Dùng Framer Motion cho animation phức tạp
```typescript
// ✅ CHUẨN - Chỉ import từ "framer-motion"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ❌ SAI - Không được import từ "motion/react" trong dự án này
import { motion } from "motion/react";
```

#### Quy tắc Animation:
- **Bắt buộc check `useReducedMotion()`** để tôn trọng cấu hình hệ thống của người dùng.
- **Chỉ animate `transform` (scale, x, y) và `opacity`** để tối ưu GPU acceleration.
- **CẤM TUYỆT ĐỐI** animate các thuộc tính kích thước layout trực tiếp như `top`, `left`, `width`, `height` (gây layout thrashing).
- Tránh dùng `window.addEventListener("scroll")` để làm scroll effects. Thay bằng `useScroll` của Framer Motion.

#### Mẫu Scroll Reveal chuẩn:
```tsx
const shouldReduceMotion = useReducedMotion();

// Animate reveal
<motion.div
  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>
```

### 7.2 CSS Transition cho Hover Effects

#### Shadow & Depth:
- Tránh dùng các class shadow mặc định như `shadow-lg`, `shadow-xl`.
- **Card hover cực nhẹ:** `hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]`
- **Elevated card (như Gói VIP/Pro):** `shadow-[0_8px_24px_rgba(37,99,235,0.12)]`

```tsx
// ✅ Card hover transition mẫu
<div className="border border-gray-200 rounded-xl p-6 transition-all duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 cursor-pointer">
```

---

## 8. Pattern Xử Lý Loading & Error State

```typescript
// ✅ Chuẩn - Luôn xử lý đủ 3 trạng thái
export function ListingPage({ id }: { id: number }) {
  const { data, isLoading, error } = useListing(id);

  // Loading state - dùng Skeleton, không dùng spinner cả trang
  if (isLoading) return <ListingCardSkeleton />;

  // Error state - thân thiện với user và có nút retry
  if (error) return (
    <ErrorCard
      message="Không thể tải thông tin phòng trọ"
      action={{ label: "Thử lại", onClick: refetch }}
    />
  );

  // Success state
  return <ListingDetail listing={data} />;
}
```

---

## 9. Accessibility (a11y)

```typescript
// ✅ LUÔN thêm aria-label cho icon buttons
<Button variant="ghost" size="icon" aria-label="Yêu thích listing">
  <Heart className="h-4 w-4" />
</Button>

// ✅ Alt text cho hình ảnh
<Image src={listing.imageUrl} alt={`Ảnh chụp thực tế của ${listing.title}`} />

// ✅ Role cho interactive elements
<div role="button" tabIndex={0} onKeyDown={handleKeyDown} onClick={handleClick}>

// ✅ Đủ color contrast - không dùng text màu nhạt trên nền trắng
// ❌ text-gray-300 trên nền trắng - contrast ratio < 4.5:1
// ✅ text-gray-600 trên nền trắng - đạt WCAG AA
```

---

## 10. Naming Convention Frontend

```typescript
// Files: kebab-case
listing-card.tsx
use-listing-filters.ts
listing-store.ts

// Components: PascalCase
export function ListingCard() {}
export function CreateListingDialog() {}

// Hooks: camelCase bắt đầu bằng "use"
export function useListingFilters() {}
export function useMapbox() {}

// Stores: camelCase, suffix "Store"  
export const useAuthStore = create(...)
export const useListingStore = create(...)

// Types/Interfaces: PascalCase, suffix "DTO" hoặc "Props"
interface ListingDTO {}
interface ListingCardProps {}
type ListingStatus = "ACTIVE" | "INACTIVE" | "PENDING";
```
