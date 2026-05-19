# 📚 Project Context — RentSpace

> **Dành cho AI Agent:** Đây là tài liệu kỹ thuật cốt lõi. Đọc và ghi nhớ toàn bộ trước khi thực hiện bất kỳ thay đổi nào.

---

## 1. Tổng Quan Dự Án

| Thuộc tính | Giá trị |
|---|---|
| **Tên dự án** | RentSpace |
| **Mô tả** | Nền tảng cho thuê không gian trực tuyến tại Việt Nam |
| **Kiến trúc** | Fullstack Monorepo (Backend + Frontend riêng biệt) |
| **Môi trường** | Docker Compose (dev) + VPS (prod) |

---

## 2. Stack Công Nghệ

### 2.1 Backend

| Thành phần | Công nghệ | Version |
|---|---|---|
| **Runtime** | Java | 17 (LTS) |
| **Framework** | Spring Boot | 3.3.5 |
| **Web** | Spring MVC (REST) | - |
| **Security** | Spring Security + JJWT | 0.12.5 |
| **ORM** | Spring Data JPA + Hibernate Spatial | - |
| **Database** | PostgreSQL + PostGIS extension | 16-3.4 |
| **Cache** | Redis (Spring Data Redis) | 7-alpine |
| **Migration** | Flyway | - |
| **WebSocket** | Spring WebSocket (STOMP) | - |
| **File Storage** | AWS S3 SDK v2 | 2.25.40 |
| **Email** | Spring Mail | - |
| **Docs** | SpringDoc OpenAPI (Swagger UI) | 2.5.0 |
| **Mapping** | MapStruct | 1.5.5.Final |
| **Utilities** | Lombok | - |
| **Build tool** | Maven Wrapper (mvnw) | - |

### 2.2 Frontend

| Thành phần | Công nghệ | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **Language** | TypeScript | ^5 |
| **Runtime** | React | 19.2.4 |
| **Auth** | NextAuth.js v5 (beta) | 5.0.0-beta.31 |
| **Styling** | TailwindCSS v4 | ^4.3.0 |
| **UI Components** | Shadcn UI (Radix UI) | - |
| **UI Library** | Ant Design | ^6.3.7 |
| **Animation** | Framer Motion | ^12 |
| **State (server)** | TanStack React Query | ^5 |
| **State (client)** | Zustand | ^5 |
| **Forms** | React Hook Form + Zod | - |
| **Maps** | Mapbox GL + react-map-gl | ^3 |
| **Charts** | Recharts | ^3 |
| **HTTP Client** | Axios | ^1 |
| **WebSocket** | STOMP.js + SockJS | - |
| **Icons** | Lucide React | - |
| **Date Utils** | date-fns + dayjs | - |

### 2.3 Infrastructure

| Thành phần | Công nghệ |
|---|---|
| **Containerization** | Docker + Docker Compose |
| **Reverse Proxy** | Nginx |
| **CI/CD** | GitHub Actions |
| **File Storage** | AWS S3 (production) / Local (development) |

---

## 3. Cấu Trúc Thư Mục Chi Tiết

```
RentSpace/                          # Monorepo root
├── .env                            # Biến môi trường (KHÔNG commit)
├── .env.example                    # Template biến môi trường
├── .gemini/                        # AI Agent configuration
│   ├── rules/                      # Quy tắc cho AI
│   └── agents/                     # Định nghĩa các AI agents
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # GitHub Actions pipeline
├── backend/                        # Spring Boot application
│   ├── src/main/java/com/rentspace/
│   │   ├── RentspaceBackendApplication.java
│   │   ├── config/                 # Spring config beans
│   │   ├── controller/             # REST Controllers (@RestController)
│   │   ├── dto/                    # Data Transfer Objects
│   │   │   ├── request/            # Request DTOs
│   │   │   └── response/           # Response DTOs
│   │   ├── entity/                 # JPA Entities (@Entity)
│   │   ├── enums/                  # Java Enums (KycStatus, Role, ...)
│   │   ├── exception/              # Custom exceptions + GlobalExceptionHandler
│   │   ├── mapper/                 # MapStruct mappers
│   │   ├── repository/             # Spring Data JPA repositories
│   │   ├── security/               # JWT filter, UserDetails, SecurityConfig
│   │   └── service/                # Business logic services
│   ├── src/main/resources/
│   │   ├── application.yml         # Cấu hình Spring Boot
│   │   └── db/migration/           # Flyway migration scripts (V1__, V2__, ...)
│   ├── src/test/                   # Unit & Integration tests
│   ├── Dockerfile                  # Backend Docker image
│   └── pom.xml                     # Maven dependencies
├── frontend/                       # Next.js application
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (auth)/             # Auth routes group
│   │   │   ├── (main)/             # Main app routes group
│   │   │   └── api/auth/           # NextAuth API routes
│   │   ├── components/             # Shared UI components
│   │   │   ├── ui/                 # Shadcn UI primitives
│   │   │   └── shared/             # Business components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities
│   │   │   ├── api.ts              # Axios instance + interceptors
│   │   │   └── utils.ts            # cn(), format helpers
│   │   ├── stores/                 # Zustand stores
│   │   └── types/                  # TypeScript interfaces
│   ├── public/                     # Static assets
│   ├── Dockerfile                  # Frontend Docker image
│   └── package.json
├── nginx/                          # Nginx reverse proxy config
├── docker-compose.yml              # Development environment
├── docker-compose.prod.yml         # Production environment
└── sample_data.sql                 # Dữ liệu mẫu cho development
```

---

## 4. Kiến Trúc Hệ Thống (Backend Layers)

```
HTTP Request
    ↓
[Controller Layer]        @RestController — Nhận request, validate @Valid, gọi Service
    ↓
[Service Layer]           @Service — Business logic, @Transactional, throw exceptions
    ↓
[Repository Layer]        @Repository — Spring Data JPA, custom JPQL queries
    ↓
[Entity Layer]            @Entity — JPA entities, Hibernate Spatial cho geo queries
    ↓
[Database]                PostgreSQL 16 + PostGIS + Flyway migrations
```

**Luồng bảo mật:**
```
Request → JwtAuthFilter → SecurityContext → @PreAuthorize → Controller
```

---

## 5. Biến Môi Trường Quan Trọng

```bash
# Database
DB_URL=jdbc:postgresql://localhost:5433/rentspace
DB_USERNAME=postgres
DB_PASSWORD=<secret>

# JWT
JWT_SECRET=<min 256-bit secret>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3
AWS_ACCESS_KEY=<key>
AWS_SECRET_KEY=<secret>
AWS_S3_BUCKET=rentspace-uploads
AWS_REGION=ap-southeast-1

# Email
MAIL_USERNAME=<email>
MAIL_PASSWORD=<app-password>

# Frontend
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=<token>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
```

---

## 6. Quy Ước Đặt Tên Database (Flyway)

Flyway migration scripts phải tuân theo format:
```
V{version}__{description}.sql
Ví dụ: V1__create_users_table.sql
        V2__add_kyc_status_column.sql
        V3__create_listings_table.sql
```

**QUAN TRỌNG:** Sau khi migration đã chạy trên môi trường nào, KHÔNG được sửa file đó.

---

## 7. API Base URL & Chuẩn Response

- **Base URL:** `http://localhost:8080/api/v1`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`

**Chuẩn Response wrapper:**
```java
// Tất cả response PHẢI bọc trong ApiResponse<T>
ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
    .success(true)
    .message("Thao tác thành công")
    .data(userDto)
    .build();
```
