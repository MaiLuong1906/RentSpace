# 🏠 RentSpace — Nền tảng Mạng xã hội & Thuê phòng trọ thông minh

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black.svg?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.0-blueviolet.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16--PostGIS-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg?style=flat-square&logo=redis)](https://redis.io/)
[![Project Phase](https://img.shields.io/badge/Phase-4%20Completed-orange.svg?style=flat-square)](#-lộ-trình-phát-triển-roadmap)

> **RentSpace** là giải pháp toàn diện kết nối người thuê trọ (Tenant) và chủ nhà (Landlord) tại Việt Nam thông qua một hệ sinh thái an toàn, minh bạch, có tính tương tác cộng đồng cao và tích hợp trí tuệ nhân tạo (AI).

---

## 📋 Mục lục

1. [Tổng quan dự án](#-tổng-quan-dự-án)
2. [Vấn đề & Giải pháp](#-vấn-đề--giải-pháp)
3. [Các tính năng nổi bật (All-Phases Done)](#-các-tính-năng-nổi-bật-all-phases-done)
4. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
5. [Tech Stack & Tích hợp dịch vụ](#-tech-stack--tích-hợp-dịch-vụ)
6. [Cấu trúc thư mục Monorepo](#-cấu-trúc-thư-mục-monorepo)
7. [Bắt đầu dự án (Getting Started)](#-bắt-đầu-dự-án-getting-started)
8. [Tuân thủ pháp lý & Bảo mật](#-tuân-thủ-pháp-lý--bảo-mật)
9. [Quy trình phát triển & Đóng góp](#-quy-trình-phát-triển--đóng-góp)

---

## 🎯 Tổng quan dự án

| Thuộc tính | Chi tiết |
|---|---|
| **Tên sản phẩm** | RentSpace |
| **Loại ứng dụng** | Web Application (Responsive thiết kế tối ưu trên cả Desktop & Mobile) |
| **Đối tượng người dùng** | Sinh viên, người đi làm độ tuổi 18–35 tại các đô thị lớn (Hà Nội, TP.HCM, Đà Nẵng) |
| **Quy mô dự án** | Hệ thống Web-First Monorepo hoàn chỉnh với AI Layer, Trust Layer & Hệ thống thanh toán thực |
| **Quy trình vận hành** | Agile Scrum — Tự động tích hợp & kiểm thử liên tục qua GitHub Actions CI/CD |

---

## 💡 Vấn đề & Giải pháp

### Pain Points trên thị trường cho thuê trọ hiện nay
1. **Lừa đảo tiền đặt cọc:** Giao dịch qua các hội nhóm MXH trôi nổi không được bảo vệ.
2. **Thông tin ảo, ảnh ảo:** Hình ảnh được chỉnh sửa quá đà hoặc sai lệch thực tế, gây mất thời gian xem phòng.
3. **Thiếu đánh giá khách quan:** Người thuê không có thông tin lịch sử về chủ trọ, khu vực xung quanh và an ninh phòng trọ.
4. **Hợp đồng mập mờ:** Thỏa thuận miệng hoặc văn bản giấy dễ bị thay đổi đơn phương, thiếu ràng buộc pháp lý số.

### Giải pháp RentSpace — Hệ sinh thái tích hợp 3-trong-1

```
┌────────────────────────────────────────────────────────────────────────┐
│                              RENTSPACE                                 │
│                                                                        │
│   🤝 SOCIAL NETWORK   +   🏠 BOOKING SYSTEM   +   🤖 AI & TRUST LAYER  │
│                                                                        │
│  • Bảng tin & ở ghép       • Đặt cọc giữ phòng       • eKYC xác thực   │
│  • Đánh giá hai chiều      • Quản lý ví & Payout     • Trợ lý hợp đồng │
│  • Chat & STOMP realtime   • Gói Seller Pro Sub      • Tìm kiếm bằng AI│
└────────────────────────────────────────────────────────────────────────┘
```

**Điểm khác biệt cốt lõi (Unique Value Proposition):**
RentSpace không chỉ dừng lại ở việc đăng tin. Hệ thống xây dựng **danh tính số có xác thực eKYC** và tích hợp **Ví giữ tiền cọc an toàn (Escrow Payment)** kết hợp **Hợp đồng điện tử ký số**. Mọi giao dịch và đánh giá đều được ghi nhận trực quan, công bằng cho cả chủ nhà lẫn khách thuê.

---

## 🚀 Các tính năng nổi bật (All-Phases Done)

Hệ thống đã hoàn thiện 100% lộ trình phát triển thông qua 4 giai đoạn lớn:

### 🔑 Phân hệ Xác thực & Định danh (Trust Layer)
- [x] **Xác thực đa phương thức:** Đăng ký/Đăng nhập bảo mật qua Email, JWT Session nâng cao và Google OAuth (NextAuth v5).
- [x] **eKYC Tự động (Tích hợp FPT.AI):** Xác minh danh tính người dùng bằng chụp ảnh thẻ CCCD/CMND (OCR trích xuất thông tin tự động) và so khớp khuôn mặt (Face Matching).
- [x] **Admin Approval Flow:** Bảng điều khiển quản lý yêu cầu xác minh thủ công hoặc tự động và hiển thị tích xanh chuyên nghiệp (`Verified Badge`) trên profile.

### 🏠 Đăng tin & Tìm kiếm thông minh (Listing & Map)
- [x] **Quản lý Listing:** Chủ nhà đăng tin kèm thư viện ảnh/video chất lượng cao, định vị tọa độ, tiện nghi và thông tin phòng chi tiết.
- [x] **Tìm kiếm & Lọc nâng cao:** Tìm kiếm theo bán kính địa lý động, loại phòng trọ, mức giá và tiện ích.
- [x] **Bản đồ tương tác Mapbox:** Hiển thị vị trí phòng trọ trực quan trực tiếp trên bản đồ Mapbox GL JS phía Client kết hợp truy vấn không gian PostGIS phía Backend.
- [x] **Smart Price Suggestion Engine:** Hệ thống gợi ý khoảng giá tối ưu khi đăng tin dựa trên dữ liệu so chuẩn (Price Benchmarks) từ các phòng trọ tương đồng cùng khu vực.

### 💳 Giao dịch điện tử & Doanh thu (Marketplace Core)
- [x] **Thanh toán đặt cọc MoMo:** Khách thuê chuyển tiền cọc trực tuyến. Tiền được RentSpace đóng vai trò trung gian giữ an toàn (Escrow) và chỉ giải ngân (Release) khi có xác nhận nhận phòng thành công hoặc xử lý khiếu nại (Disputes).
- [x] **Seller Pro Subscription:** Hệ thống gói đăng ký thành viên nâng cao cho chủ trọ, mở giới hạn số tin đăng, đẩy tin nổi bật (Promoted Listings) và truy cập dashboard phân tích.
- [x] **Hệ thống Payout:** Chủ trọ liên kết tài khoản ngân hàng chính chủ, theo dõi số dư ví và gửi yêu cầu rút tiền tự động/thủ công từ dashboard.

### 📝 Hợp đồng điện tử & Đánh giá hai chiều
- [x] **Digital Contracts:** Tự động tạo lập hợp đồng thuê nhà điện tử với các điều khoản mẫu hợp pháp.
- [x] **E-signature:** Cho phép cả chủ nhà và người thuê thực hiện ký số trực tiếp trên giao diện web.
- [x] **PDF Generator & Email Alert:** Sau khi hai bên hoàn tất ký, hệ thống tự động xuất file PDF hợp đồng bất biến và gửi đính kèm qua email giao dịch.
- [x] **Bidirectional Reviews:** Đánh giá 2 chiều sau khi giao dịch hoàn tất. Khách thuê đánh giá chất lượng phòng và chủ trọ; chủ trọ đánh giá độ uy tín của khách thuê.

### 💬 Tương tác xã hội & Tìm bạn ở ghép
- [x] **Chat Realtime STOMP:** Nhắn tin thời gian thực đa phương tiện (văn bản, hình ảnh, liên kết phòng trọ) giữa người thuê và chủ nhà.
- [x] **Bảng tin Cộng đồng:** Nơi đăng tải các tin tức tìm phòng, nhượng phòng trọ và thảo luận xã hội.
- [x] **Roommate Matching:** Bộ lọc ghép cặp tìm bạn ở ghép dựa trên các tiêu chí thói quen sinh hoạt, giờ giấc, giới tính và nghề nghiệp.

### 🤖 AI Assistant Layer
- [x] **Semantic Search Agent:** Người dùng có thể tìm phòng trọ bằng câu hỏi tự nhiên tiếng Việt (Ví dụ: *"Tìm phòng trọ cho nữ ở gần Đại học Bách Khoa dưới 3 triệu"*). Hệ thống sử dụng LLM để hiểu ý định và truy vấn dữ liệu chính xác.
- [x] **Contract AI Assistant:** Hỗ trợ người dùng phân tích, tóm tắt điều khoản hợp đồng và giải đáp các thắc mắc về mặt pháp lý/rủi ro trong hợp đồng thuê nhà.

---

## 🏗️ Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình Monorepo tách biệt Frontend và Backend, giao tiếp thông qua RESTful APIs và WebSockets bảo mật cao:

```
                            ┌───────────────────┐
                            │    Cloudflare     │
                            │ (DNS, SSL, DDoS)  │
                            └─────────┬─────────┘
                                      │
                            ┌─────────▼─────────┐
                            │       NGINX       │
                            │  (Reverse Proxy)  │
                            └────┬──────────┬───┘
                                 │          │
                 ┌───────────────┘          └───────────────┐
                 │ (Port 3000)                              │ (Port 8080)
        ┌────────▼────────┐                        ┌────────▼────────┐
        │     Next.js     │                        │   Spring Boot   │
        │   (Frontend)    │                        │  (Backend API)  │
        └─────────────────┘                        └────────┬────────┘
                                                            │
                                            ┌───────────────┼───────────────┐
                                            │               │               │
                                     ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
                                     │ PostgreSQL  │ │    Redis    │ │  Amazon S3  │
                                     │  + PostGIS  │ │   (Cache)   │ │  (Storage)  │
                                     └─────────────┘ └─────────────┘ └─────────────┘
```

- **Backend Architecture:** Theo chuẩn Clean Architecture / Layered Architecture (`Controller` -> `Service` -> `Repository` -> `Entity`).
- **Database Migrations:** Quản lý thay đổi schema chặt chẽ thông qua Flyway (tổng cộng 39 migrations từ thiết lập ban đầu đến tối ưu hóa thống kê phân tích nâng cao).

---

## 🛠️ Tech Stack & Tích hợp dịch vụ

### Backend (Java Spring Boot Stack)
- **Runtime:** Java 21 (LTS).
- **Framework:** Spring Boot 3.3.5.
- **Security:** Spring Security + JJWT 0.12.5 (xác thực không trạng thái stateless JWT).
- **ORM:** Spring Data JPA + Hibernate Spatial (xử lý dữ liệu GIS tọa độ địa lý).
- **Database:** PostgreSQL 16 + PostGIS extension.
- **Caching:** Redis 7 (Quản lý cache, rate limit và JWT blacklist).
- **WebSocket:** Spring WebSockets + STOMP Protocol.
- **File Storage:** AWS S3 SDK v2 (Hỗ trợ lưu trữ file tại local trong môi trường dev và AWS S3 trên production).
- **Migration:** Flyway.
- **API Docs:** SpringDoc OpenAPI v2 (Swagger UI).
- **Mapping:** MapStruct 1.5.5.

### Frontend (Next.js App Router Stack)
- **Framework:** Next.js 16.2.6 (App Router) với React 19.2.4.
- **Authentication:** NextAuth.js v5 (beta) tích hợp Google Provider.
- **Styling:** TailwindCSS v4.0.
- **Component UI:** Shadcn UI (Radix UI) kết hợp Ant Design v6.
- **Animation:** Framer Motion v12.
- **State Management:** TanStack React Query v5 (đồng bộ dữ liệu server) & Zustand v5 (quản lý state client).
- **Map Library:** Mapbox GL + React Map GL v3.
- **Charts:** Recharts v3 (vẽ biểu đồ thống kê doanh thu chủ trọ và tương tác).
- **Form:** React Hook Form + Zod validator.

### Dịch vụ bên thứ ba (Third-party integrations)
- **Thanh toán:** Ví điện tử MoMo Sandbox API.
- **KYC xác thực:** FPT.AI OCR Reader & Face Matching API.
- **Email:** Resend API / SMTP Spring Mail.
- **AI Engine:** OpenAI API (GPT-4o/GPT-4o-mini) phục vụ Trợ lý Hợp đồng AI và Tìm kiếm ngữ nghĩa.

---

## 📁 Cấu trúc thư mục Monorepo

```
RentSpace/
├── backend/                       # Dự án Java Spring Boot
│   ├── src/main/java/com/rentspace/
│   │   ├── config/                # Cấu hình bảo mật, Swagger, WebSocket, AWS
│   │   ├── controller/            # Lớp REST Controllers tiếp nhận HTTP requests
│   │   ├── domain/                # Các module nghiệp vụ chính (kyc, listing, payment...)
│   │   ├── dto/                   # Data Transfer Objects (Request/Response)
│   │   ├── entity/                # Lớp thực thể ánh xạ JPA database
│   │   ├── mapper/                # MapStruct mappers chuyển đổi DTO <-> Entity
│   │   └── security/              # JWT Filters, Custom UserDetails
│   ├── src/main/resources/
│   │   ├── db/migration/          # Tập lệnh Flyway SQL migrations (V1 -> V39)
│   │   └── application.yml        # Cấu hình thuộc tính Spring Boot
│   └── pom.xml                    # Cấu hình dependency Maven
│
├── frontend/                      # Dự án Next.js App Router
│   ├── src/
│   │   ├── app/                   # Định tuyến App Router (App Pages & Layouts)
│   │   │   ├── (auth)/            # Nhóm định tuyến Xác thực
│   │   │   ├── app/               # Dashboard người dùng, chủ trọ & Admin
│   │   │   └── api/auth/          # Endpoint NextAuth
│   │   ├── components/            # Thư viện component tái sử dụng (ui & shared)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Client API Axios, utils định dạng
│   │   ├── stores/                # Các state store của Zustand
│   │   └── types/                 # Định nghĩa kiểu TypeScript
│   └── package.json               # Cấu hình dependency Node.js
│
├── nginx/                         # Cấu hình Nginx reverse proxy
├── docker-compose.yml             # Khởi chạy môi trường Docker Local (DB, Redis)
├── docker-compose.prod.yml        # Khởi chạy môi trường Docker Production đầy đủ
├── sample_data.sql                # Dữ liệu mẫu (listings, users, reviews) để phát triển nhanh
└── GEMINI.md                      # Tài liệu hướng dẫn dành riêng cho AI Agent
```

---

## 🏁 Bắt đầu dự án (Getting Started)

### Yêu cầu môi trường tối thiểu
- **Java Development Kit (JDK):** Version 21.
- **Node.js:** Version 20.x (LTS) trở lên.
- **Docker & Docker Compose:** Đã được cài đặt và đang chạy.

---

### Bước 1: Clone Repository & Cấu hình môi trường
1. Clone dự án về máy:
   ```bash
   git clone https://github.com/MaiLuong1906/RentSpace.git
   cd RentSpace
   ```
2. Tạo file `.env` từ file mẫu ở thư mục gốc:
   ```bash
   cp .env.example .env
   ```
3. Mở file `.env` vừa tạo và điền đầy đủ các khóa API bảo mật (Database credentials, JWT secret, OpenAI key, FPT.AI credentials, Mapbox token, Client ID Google OAuth, v.v.).

---

### Bước 2: Khởi chạy cơ sở dữ liệu bổ trợ (Docker compose)
Dự án sử dụng cơ sở dữ liệu PostgreSQL (tích hợp PostGIS) và Redis chạy trên container để đảm bảo môi trường đồng nhất.
```bash
# Khởi chạy Postgres & Redis dưới dạng daemon (background)
docker compose up -d postgres redis
```
*Lưu ý: PostgreSQL sẽ được ánh xạ qua cổng host **5433** để tránh xung đột với dịch vụ Postgres cục bộ của bạn.*

---

### Bước 3: Khởi chạy Backend (Spring Boot)
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Build dự án và khởi chạy ứng dụng Spring Boot thông qua Maven wrapper:
   ```bash
   # Dành cho Windows (PowerShell/CMD)
   .\mvnw spring-boot:run
   
   # Dành cho Linux/macOS
   ./mvnw spring-boot:run
   ```
3. Sau khi chạy thành công, API sẽ hoạt động tại: `http://localhost:8080`
4. Bạn có thể truy cập Swagger UI để xem tài liệu API tại: `http://localhost:8080/swagger-ui/index.html`

---

### Bước 4: Khởi chạy Frontend (Next.js)
1. Mở một terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Development server):
   ```bash
   npm run dev
   ```
4. Truy cập giao diện người dùng tại địa chỉ trình duyệt: `http://localhost:3000`

---

### 🔍 Địa chỉ các dịch vụ sau khi chạy local
| Dịch vụ | URL | Thông tin truy cập |
|---|---|---|
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Trải nghiệm giao diện người dùng |
| **Backend REST APIs** | [http://localhost:8080](http://localhost:8080) | Cổng API cơ sở |
| **API Docs (Swagger UI)** | [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) | Kiểm thử API trực tiếp |
| **PostgreSQL Database** | `localhost:5433` | Database: `rentspace` |
| **Redis Server** | `localhost:6379` | Cache & Rate Limiting |

---

## ⚖️ Tuân thủ pháp lý & Bảo mật

Ứng dụng RentSpace được thiết kế nghiêm túc tuân thủ các quy định hiện hành tại Việt Nam:
1. **Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân (GDPR Việt Nam):**
   - Mọi thông tin CCCD tải lên để eKYC đều được mã hóa lưu trữ an toàn hoặc chuyển tiếp trực tiếp đến cổng đối tác FPT.AI, không lưu trữ thông tin ID thô chưa xử lý.
   - Người dùng có quyền yêu cầu xóa bỏ hoặc điều chỉnh thông tin cá nhân bất kỳ lúc nào.
2. **Nghị định 72/2013/NĐ-CP về Quản lý dịch vụ Internet & thông tin trên mạng:**
   - Hệ thống trang bị tính năng Báo cáo tin đăng vi phạm (Report/Flag). Tin đăng nhận quá 3 lượt báo cáo sẽ tự động bị ẩn khỏi trang tìm kiếm công khai và chuyển đến hàng đợi xử lý của quản trị viên (Admin queue).
3. **An toàn thanh toán:**
   - Giao dịch đặt cọc được giữ an toàn trên cổng trung gian thanh toán liên kết thay vì tự giữ tiền thủ công trái phép.

---

## 🤝 Quy trình phát triển & Đóng góp

Để đảm bảo chất lượng code cao nhất trên nhánh chính `main`, dự án áp dụng quy tắc kiểm thử nghiêm ngặt trước khi push:

### ⚠️ Quy tắc kiểm tra bắt buộc (Pre-push Validation)
Trước khi đẩy bất kỳ mã nguồn mới nào lên GitHub, bạn **phải** chạy thành công các lệnh kiểm thử cục bộ:
1. **Backend validation (Kiểm tra biên dịch & Unit tests):**
   ```bash
   cd backend && ./mvnw clean compile test-compile
   ```
2. **Frontend validation (Kiểm tra ESLint & Lỗi TypeScript):**
   ```bash
   cd frontend && npm run lint
   ```

### 📝 Quy ước Commit Message
Mọi commit phải tuân thủ chặt chẽ định dạng **Conventional Commits**:
- `feat(scope): ...` khi thêm tính năng mới.
- `fix(scope): ...` khi sửa lỗi.
- `docs(scope): ...` khi cập nhật tài liệu hoặc README.
- `chore(scope): ...` khi nâng cấp dependency hoặc tác vụ dọn dẹp cấu hình.

---

*Cập nhật lần cuối: Tháng 6/2026 — Tài liệu được đồng bộ hóa với hiện trạng thực tế của mã nguồn sau khi hoàn thành Phase 4.*
