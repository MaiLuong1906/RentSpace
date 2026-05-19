# 🏛️ Frontend Architect Agent — RentSpace

> **Kích hoạt khi:** Tạo page mới, thiết kế component, cấu trúc state management, tích hợp Mapbox, hoặc xử lý WebSocket realtime.

---

## Nhiệm Vụ

Frontend Architect chuyên đảm bảo codebase Next.js 16 + React 19 + TypeScript được tổ chức đúng chuẩn, hiệu năng cao, và trải nghiệm người dùng tốt nhất.

---

## 1. Cấu Trúc App Router (Next.js 16)

### Route Groups Hiện Tại

```
src/app/
├── layout.tsx                  # Root layout (font, providers, metadata)
├── page.tsx                    # Landing page (/)
├── (auth)/                     # Route group — KHÔNG ảnh hưởng URL
│   ├── login/page.tsx          # /login
│   ├── register/page.tsx       # /register
│   └── layout.tsx              # Auth layout (centered, no navbar)
├── (main)/                     # Route group — có Navbar/Footer
│   ├── listings/
│   │   ├── page.tsx            # /listings (search page)
│   │   └── [id]/page.tsx       # /listings/:id (detail page)
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard sidebar layout
│   │   ├── page.tsx            # /dashboard
│   │   └── my-listings/page.tsx
│   └── profile/page.tsx
└── api/
    └── auth/[...nextauth]/route.ts  # NextAuth handler
```

### Protocol Tạo Page Mới

```typescript
// ✅ Chuẩn — Server Component với metadata
// app/(main)/listings/[id]/page.tsx
import type { Metadata } from 'next';

// Metadata động từ server (tốt cho SEO)
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = await listingApi.getById(Number(params.id));
  return {
    title: `${listing.title} | RentSpace`,
    description: listing.description.slice(0, 160),
    openGraph: { images: [listing.images[0]?.url] },
  };
}

// Server Component — Fetch data trực tiếp, không cần React Query
export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await listingApi.getById(Number(params.id));
  return <ListingDetail listing={listing} />;
}

// ✅ Client Component — chỉ khi cần interactivity
'use client'; // Chỉ thêm khi cần useState, useEffect, event handlers
```

---

## 2. Component Architecture

### Phân Loại Component

```
components/
├── ui/              # Shadcn UI primitives — KHÔNG sửa trực tiếp
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── shared/          # Business components — reusable
│   ├── listing-card.tsx
│   ├── user-avatar.tsx
│   └── price-display.tsx
└── features/        # Feature-specific components — ít reuse
    ├── listing/
    │   ├── listing-detail.tsx
    │   ├── listing-gallery.tsx
    │   └── listing-filter-sidebar.tsx
    ├── auth/
    └── dashboard/
```

### Protocol Tạo Component

```typescript
// ✅ Template component chuẩn
// components/shared/listing-card.tsx

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ListingDTO } from '@/types/listing';

interface ListingCardProps {
  listing: ListingDTO;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
  onFavorite?: (id: number) => void;
}

export function ListingCard({
  listing,
  variant = 'default',
  className,
  onFavorite,
}: ListingCardProps) {
  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-0">
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

---

## 3. State Management Protocol

### Phân Loại State

```
Server State (API data)    → React Query (useQuery, useMutation)
Client State (UI state)    → useState / useReducer (local)
Global Client State        → Zustand (cross-component)
URL State (filters/search) → nuqs (URL search params)
Form State                 → React Hook Form
```

### Zustand Stores Hiện Tại

```typescript
// stores/auth-store.ts — User authentication state
interface AuthStore {
  user: UserDTO | null;
  isLoading: boolean;
  setUser: (user: UserDTO | null) => void;
}

// stores/listing-store.ts — Search filters & map state
interface ListingStore {
  filters: ListingFilters;
  mapCenter: { lat: number; lng: number };
  setFilters: (filters: Partial<ListingFilters>) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
}

// ❌ KHÔNG lưu API response vào Zustand
// Đây là server state → dùng React Query
const useListingStore = create(() => ({ listings: [] })); // Sai!
```

---

## 4. Protocol Mapbox Integration

RentSpace dùng Mapbox GL + react-map-gl cho tính năng tìm kiếm theo vị trí.

```typescript
// ✅ Chuẩn — MapBox component với lazy import (giảm bundle size)
import dynamic from 'next/dynamic';

const ListingMap = dynamic(() => import('@/components/features/listing/listing-map'), {
  ssr: false,  // Mapbox không hỗ trợ SSR
  loading: () => <div className="w-full h-96 bg-muted animate-pulse rounded-lg" />,
});

// ✅ Dùng NEXT_PUBLIC_MAPBOX_TOKEN từ env
// ✅ Cleanup event listeners trong useEffect
// ✅ Cluster markers khi zoom out
```

---

## 5. Protocol WebSocket (Chat Realtime)

```typescript
// ✅ Custom hook quản lý WebSocket connection
export function useChat(roomId: string) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`),
      onConnect: () => {
        client.subscribe(`/topic/room/${roomId}`, (frame) => {
          const message: MessageDTO = JSON.parse(frame.body);
          setMessages(prev => [...prev, message]);
        });
      },
      reconnectDelay: 5000,  // Auto reconnect sau 5s
    });

    client.activate();
    clientRef.current = client;

    // Cleanup khi unmount — QUAN TRỌNG để tránh memory leak
    return () => { client.deactivate(); };
  }, [roomId]);

  const sendMessage = useCallback((content: string) => {
    clientRef.current?.publish({
      destination: `/app/room/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
  }, [roomId]);

  return { messages, sendMessage };
}
```

---

## 6. Protocol NextAuth v5 (Beta)

```typescript
// ✅ auth.ts — Config NextAuth
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        // Gọi backend /api/v1/auth/login
        // Return user object hoặc null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Thêm accessToken từ backend vào JWT
      if (user) token.accessToken = user.accessToken;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

// ✅ Protect route với middleware.ts
export { auth as middleware } from "@/auth";
export const config = { matcher: ['/dashboard/:path*', '/profile/:path*'] };
```

---

## 7. Checklist Tự Kiểm Tra Frontend

```
□ Component mới có TypeScript interface đầy đủ (không dùng any)
□ 'use client' chỉ thêm khi thực sự cần (tránh làm Server Component thành Client)
□ Dùng next/image cho tất cả hình ảnh (có width, height, alt)
□ Mapbox component được lazy load với dynamic()
□ WebSocket có cleanup trong useEffect return
□ Form có validation bằng Zod schema
□ Loading state hiển thị Skeleton (không phải spinner che toàn trang)
□ Error state hiển thị message thân thiện với nút retry
□ Responsive design check trên mobile (375px) và desktop (1280px)
□ aria-label cho icon buttons
□ Không có console.log trong production code
□ Env vars NEXT_PUBLIC_* được dùng đúng (không expose secret qua NEXT_PUBLIC)
```
