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

## 2. Hệ Thống Màu Sắc (Color System)

Dự án dùng **TailwindCSS v4** với CSS custom properties. Màu được định nghĩa trong `globals.css`.

### Bảng màu chính

```css
/* Light Mode */
--primary: hsl(220, 90%, 56%);         /* Xanh dương — CTA chính */
--primary-foreground: hsl(0, 0%, 100%);
--secondary: hsl(220, 14%, 96%);       /* Nền thứ cấp */
--accent: hsl(38, 92%, 50%);           /* Cam — Highlight, badge */
--destructive: hsl(0, 84%, 60%);       /* Đỏ — Error, delete */
--success: hsl(142, 71%, 45%);         /* Xanh lá — Success */

/* Neutral (Dark Mode ready) */
--background: hsl(0, 0%, 100%);
--foreground: hsl(222, 47%, 11%);
--muted: hsl(210, 40%, 96%);
--border: hsl(214, 32%, 91%);
```

### Quy tắc dùng màu

| Màu | Khi nào dùng |
|---|---|
| `primary` | Nút CTA chính, link quan trọng, active state |
| `secondary` | Nút phụ, nền section |
| `accent` | Badge "Nổi bật", giá tiền, highlight |
| `destructive` | Nút xóa, thông báo lỗi |
| `success` | Trạng thái KYC verified, booking confirmed |
| `muted` | Placeholder text, disabled state |

---

## 3. Typography

```css
/* Font stack */
font-family: 'Inter', 'Be Vietnam Pro', system-ui, sans-serif;
/* Be Vietnam Pro cho UI text tiếng Việt cho đẹp hơn */
```

### Scale Typography (TailwindCSS classes)

| Class | Size | Weight | Dùng cho |
|---|---|---|---|
| `text-4xl font-bold` | 36px / 700 | Bold | Page title (h1) |
| `text-2xl font-semibold` | 24px / 600 | Semibold | Section title (h2) |
| `text-xl font-semibold` | 20px / 600 | Semibold | Card title (h3) |
| `text-base` | 16px / 400 | Regular | Body text |
| `text-sm` | 14px / 400 | Regular | Caption, label |
| `text-xs text-muted-foreground` | 12px / 400 | Regular | Timestamp, metadata |

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

## 7. Animation & Micro-interactions

### 7.1 Dùng Framer Motion cho animation phức tạp

```typescript
// ✅ Page transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>

// ✅ Stagger animation cho danh sách card
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
```

### 7.2 CSS Transition cho hover effects

```typescript
// ✅ Card hover effect
<div className="
  transition-all duration-200 ease-in-out
  hover:shadow-lg hover:-translate-y-1
  cursor-pointer
">

// ✅ Button loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Đang xử lý..." : "Đăng tin"}
</Button>
```

---

## 8. Pattern Xử Lý Loading & Error State

```typescript
// ✅ Chuẩn — Luôn xử lý đủ 3 trạng thái
export function ListingPage({ id }: { id: number }) {
  const { data, isLoading, error } = useListing(id);

  // Loading state — dùng Skeleton, không dùng spinner cả trang
  if (isLoading) return <ListingCardSkeleton />;

  // Error state — thân thiện với user
  if (error) return (
    <ErrorCard
      message="Không thể tải thông tin listing"
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
<Image src={listing.imageUrl} alt={`Ảnh của ${listing.title}`} />

// ✅ Role cho interactive elements
<div role="button" tabIndex={0} onKeyDown={handleKeyDown} onClick={handleClick}>

// ✅ Đủ color contrast — không dùng text màu nhạt trên nền trắng
// ❌ text-gray-300 trên nền trắng — contrast ratio < 4.5:1
// ✅ text-gray-600 trên nền trắng — đạt WCAG AA
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
