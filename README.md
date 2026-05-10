# 🏠 RentSpace — Nền tảng Mạng xã hội & Đặt phòng trọ trực tuyến

> *Kết nối người thuê và chủ trọ trong một hệ sinh thái an toàn, minh bạch và có tính cộng đồng cao.*

---

## 📋 Mục lục

- [Tổng quan dự án](#-tổng-quan-dự-án)
- [Vấn đề & Giải pháp](#-vấn-đề--giải-pháp)
- [Phân tích thị trường & Đối thủ cạnh tranh](#-phân-tích-thị-trường--đối-thủ-cạnh-tranh)
- [Mô hình kinh doanh](#-mô-hình-kinh-doanh)
- [Phạm vi MVP (Phase 1)](#-phạm-vi-mvp-phase-1)
- [Product Backlog — Các nhóm tính năng cốt lõi](#-product-backlog--các-nhóm-tính-năng-cốt-lõi)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Tech Stack & Hạ tầng triển khai](#-tech-stack--hạ-tầng-triển-khai)
- [Lộ trình phát triển (Roadmap)](#-lộ-trình-phát-triển-roadmap)
- [Tuân thủ pháp lý](#-tuân-thủ-pháp-lý)
- [Bắt đầu dự án (Getting Started)](#-bắt-đầu-dự-án-getting-started)

---

## 🎯 Tổng quan dự án

| Thuộc tính | Chi tiết |
|---|---|
| **Tên dự án** | RentSpace *(tên gợi ý, có thể thay đổi)* |
| **Loại sản phẩm** | Web Application (Mobile-first Responsive) |
| **Thị trường mục tiêu** | Sinh viên, người đi làm độ tuổi 18–30 tại các đô thị lớn |
| **Địa bàn Pilot** | Đà Nẵng → mở rộng TP.HCM, Hà Nội *(Phase 2)* |
| **Quy mô phát triển** | Solo Developer (Cá nhân) |
| **Phương pháp** | Agile Scrum — Sprint 2 tuần/lần |

### Phân khúc người dùng chính (User Personas)

- 👤 **Người thuê (Tenant):** Sinh viên hoặc người đi làm đang tìm phòng trọ/chung cư mini, cần thông tin minh bạch và quy trình đặt cọc an toàn.
- 🏠 **Chủ trọ (Landlord):** Cá nhân hoặc hộ gia đình quản lý từ 1–20 phòng, cần công cụ đăng tin hiệu quả và quản lý trạng thái phòng dễ dàng.

---

## 💡 Vấn đề & Giải pháp

### Những pain point thực tế trên thị trường hiện nay

| # | Vấn đề | Tác động |
|---|---|---|
| 1 | **Lừa đảo đặt cọc** trên các hội nhóm Facebook, Zalo không được kiểm soát | Người thuê mất tiền cọc, mất lòng tin |
| 2 | **Thông tin ảo, ảnh không thực tế** — phòng trọ được đăng với hình ảnh chỉnh sửa, giá không khớp thực tế | Tốn thời gian đi xem, thất vọng khi đến nơi |
| 3 | **Thiếu review chân thực** từ người từng ở — không biết chủ trọ có tốt không, khu vực có an ninh không | Rủi ro cao khi đặt cọc lần đầu |
| 4 | **Không có kênh tìm bạn ở ghép** an toàn và có kiểm chứng danh tính | Phải tìm bạn ghép qua mạng xã hội không bảo đảm |
| 5 | **Chủ trọ thiếu công cụ quản lý** — theo dõi phòng trống/đã thuê, thu tiền, hợp đồng vẫn làm thủ công | Tốn thời gian, dễ thất thoát |

### Giải pháp — Hệ sinh thái 2-trong-1

```
┌─────────────────────────────────────────────────────┐
│                    RENTSPACE                         │
│                                                     │
│   🤝 SOCIAL NETWORK  +  🏠 BOOKING SYSTEM           │
│                                                     │
│  • Cộng đồng tìm trọ       • Đăng tin có KYC        │
│  • Review & Rating          • Đặt cọc bảo vệ        │
│  • Tìm bạn ở ghép           • Quản lý hợp đồng      │
│  • Chia sẻ kinh nghiệm      • Thanh toán online      │
└─────────────────────────────────────────────────────┘
```

**Điểm khác biệt cốt lõi (Unique Value Proposition):**
Không chỉ là trang đăng tin — RentSpace xây dựng **danh tính số có kiểm chứng** cho cả người thuê và chủ trọ, tạo ra hệ thống uy tín dựa trên lịch sử giao dịch và đánh giá thực.

---

## 📊 Phân tích thị trường & Đối thủ cạnh tranh

### Bức tranh thị trường

- **Quy mô:** Hơn 5 triệu sinh viên và hàng chục triệu người đi làm tại đô thị đang có nhu cầu thuê trọ
- **Tăng trưởng:** Nhu cầu thuê phòng ở các đô thị lớn tăng đều hàng năm cùng với tốc độ đô thị hoá

### So sánh đối thủ cạnh tranh trực tiếp

| Tiêu chí | Facebook Groups | Phongtro123 | NhaTot (Chotot) | **RentSpace** |
|---|:---:|:---:|:---:|:---:|
| Xác thực danh tính (KYC) | ❌ | ❌ | ❌ | ✅ |
| Đặt cọc bảo vệ online | ❌ | ❌ | ❌ | ✅ |
| Review từ người đã ở | ❌ | ❌ | Hạn chế | ✅ |
| Tìm bạn ở ghép | ❌ | ❌ | ❌ | ✅ |
| Tương tác cộng đồng | ✅ | ❌ | ❌ | ✅ |
| Quản lý phòng cho chủ trọ | ❌ | Cơ bản | Cơ bản | ✅ |
| SEO / Tìm kiếm Google | ❌ | ✅ | ✅ | ✅ |
| Tìm kiếm theo bản đồ | ❌ | Cơ bản | ✅ | ✅ |

> **Kết luận:** Không có đối thủ nào hiện tại kết hợp được yếu tố **cộng đồng + xác thực danh tính + bảo vệ giao dịch** trong cùng một nền tảng.

---

## 💰 Mô hình kinh doanh

### Các luồng doanh thu (Revenue Streams)

| Giai đoạn | Hình thức | Mô tả |
|---|---|---|
| **Phase 1** | Miễn phí hoàn toàn | Tập trung tăng trưởng người dùng, thu thập dữ liệu, xây dựng uy tín |
| **Phase 2** | Phí đăng tin nổi bật | Chủ trọ trả phí để tin đăng hiển thị ưu tiên (boost listing) |
| **Phase 2** | Hoa hồng giao dịch | Thu ~1–2% trên mỗi giao dịch đặt cọc thành công qua nền tảng |
| **Phase 3** | Gói Subscription | Chủ trọ nhiều phòng trả phí tháng để dùng dashboard quản lý nâng cao |
| **Phase 3** | Dịch vụ xác minh nhanh | Chủ trọ trả phí để được gắn badge "Đã xác minh cao cấp" |

---

## 🚀 Phạm vi MVP (Phase 1)

> ⚠️ **Nguyên tắc MVP:** Với quy mô phát triển cá nhân, cần xác định tập tính năng **tối thiểu nhưng đủ dùng** để ra thị trường kiểm chứng sớm nhất có thể. **Không build tất cả mọi thứ ngay từ đầu.**

### ✅ MVP bao gồm (Must Have)

- [ ] Đăng ký / Đăng nhập (Email + Google OAuth)
- [ ] Xác thực danh tính cơ bản (upload CCCD, admin duyệt thủ công)
- [ ] Phân quyền: Người thuê / Chủ trọ
- [ ] Chủ trọ đăng tin phòng trống (ảnh, mô tả, giá, vị trí)
- [ ] Người thuê tìm kiếm & lọc phòng (theo giá, khu vực, loại phòng)
- [ ] Xem phòng trên bản đồ (Map view)
- [ ] Nhắn tin trực tiếp giữa người thuê và chủ trọ
- [ ] Người thuê đánh giá/review phòng sau khi ở
- [ ] Hệ thống báo cáo/tố cáo tin đăng vi phạm
- [ ] Thông báo cơ bản (in-app + email)

### 🔄 Phase 2 — Sau khi có traction (Sau MVP)

- [ ] Đặt cọc online qua cổng thanh toán (VNPay / MoMo)
- [ ] Quản lý hợp đồng điện tử
- [ ] Tính năng tìm bạn ở ghép
- [ ] Bảng tin cộng đồng (Newsfeed)
- [ ] Dashboard quản lý phòng nâng cao cho chủ trọ
- [ ] KYC tự động tích hợp API (VNPT eKYC hoặc VNeid)

### 🌟 Phase 3 — Mở rộng

- [ ] App Mobile (React Native)
- [ ] Hệ thống gợi ý phòng (Recommendation Engine)
- [ ] Quản lý hóa đơn điện/nước tích hợp
- [ ] Mở rộng địa bàn TP.HCM, Hà Nội

---

## 📦 Product Backlog — Các nhóm tính năng cốt lõi

Hệ thống được chia thành **4 phân hệ (Epic)** chính:

---

### Epic 1 — Quản lý Người dùng (User Management)

| User Story | Độ ưu tiên |
|---|:---:|
| Người dùng có thể đăng ký bằng email hoặc Google | 🔴 Cao |
| Người dùng nhận OTP qua email/SMS để xác minh tài khoản | 🔴 Cao |
| Người dùng upload CCCD để được xác thực danh tính (KYC) | 🔴 Cao |
| Admin có thể duyệt/từ chối hồ sơ KYC trên Admin Panel | 🔴 Cao |
| Người dùng có thể chọn vai trò: Người thuê hoặc Chủ trọ | 🔴 Cao |
| Người dùng quản lý hồ sơ cá nhân (avatar, thông tin, lịch sử) | 🟡 Trung bình |
| Người dùng xem lịch sử giao dịch, review đã viết | 🟡 Trung bình |

---

### Epic 2 — Hệ thống Đăng tin & Tìm kiếm (Listing & Search)

| User Story | Độ ưu tiên |
|---|:---:|
| Chủ trọ đăng tin phòng với ảnh, video, mô tả, giá, tiện nghi | 🔴 Cao |
| Hệ thống tự động duyệt tin mới trước khi hiển thị (hoặc admin duyệt) | 🔴 Cao |
| Người thuê tìm kiếm phòng theo bộ lọc: khu vực, giá, loại phòng, tiện nghi | 🔴 Cao |
| Người thuê xem kết quả tìm kiếm trên bản đồ tương tác (Map View) | 🔴 Cao |
| Người thuê lưu danh sách phòng yêu thích | 🟡 Trung bình |
| Người thuê nhận thông báo khi có phòng mới phù hợp tiêu chí đã lưu | 🟡 Trung bình |
| Chủ trọ cập nhật trạng thái phòng: Còn trống / Đã cho thuê | 🔴 Cao |

---

### Epic 3 — Tương tác Cộng đồng (Social & Community)

| User Story | Độ ưu tiên |
|---|:---:|
| Người thuê viết review & chấm sao cho phòng đã ở | 🔴 Cao |
| Người dùng nhắn tin trực tiếp (chat realtime) với nhau | 🔴 Cao |
| Người dùng báo cáo tin đăng hoặc tài khoản vi phạm | 🔴 Cao |
| Bảng tin cộng đồng: đăng bài tìm trọ, nhượng trọ, hỏi đáp | 🟡 Trung bình *(Phase 2)* |
| Tính năng tìm bạn ở ghép (lọc theo giới tính, nghề nghiệp, lịch sinh hoạt) | 🟡 Trung bình *(Phase 2)* |
| Người dùng bình luận và tương tác trên bảng tin | 🟢 Thấp *(Phase 2)* |

---

### Epic 4 — Giao dịch & Vận hành (Booking & Operations)

| User Story | Độ ưu tiên |
|---|:---:|
| Người thuê gửi yêu cầu đặt lịch xem phòng | 🔴 Cao |
| Người thuê thanh toán đặt cọc online qua VNPay/MoMo *(Phase 2)* | 🟡 Trung bình |
| Tiền cọc được giữ bởi nền tảng, chỉ giải ngân khi hai bên xác nhận *(Phase 2)* | 🟡 Trung bình |
| Hệ thống tạo hợp đồng điện tử mẫu *(Phase 2)* | 🟢 Thấp |
| Chủ trọ quản lý danh sách phòng & trạng thái trên Dashboard | 🔴 Cao |
| Admin Panel: duyệt KYC, xử lý báo cáo, quản lý tin đăng | 🔴 Cao |

---

## 🏗️ Kiến trúc hệ thống

```
                          ┌─────────────────┐
                          │   Cloudflare    │
                          │ (DNS, SSL, DDoS)│
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │      NGINX      │
                          │ (Reverse Proxy) │
                          └──┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──┐  ┌────────▼───┐  ┌──────▼──────┐
    │  Next.js   │  │ Spring Boot│  │   Static    │
    │ (Frontend) │  │  (API)     │  │  (NGINX)    │
    │  Port 3000 │  │  Port 8080 │  └─────────────┘
    └────────────┘  └──────┬─────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼─────┐  ┌──────▼─────┐  ┌─────▼──────┐
    │ PostgreSQL │  │   Redis    │  │  Amazon S3 │
    │ + PostGIS  │  │  (Cache)   │  │  (Storage) │
    └────────────┘  └────────────┘  └────────────┘
```

---

## 🛠️ Tech Stack & Hạ tầng triển khai

### Công nghệ Cốt lõi (Core Stack)

| Layer | Công nghệ | Lý do lựa chọn |
|---|---|---|
| **Frontend** | React + Next.js + TypeScript | SSR tối ưu SEO, TypeScript bắt lỗi chặt chẽ, trải nghiệm mượt mà |
| **Backend** | Java Spring Boot | Kiến trúc vững chắc, Spring Security cho bảo mật cao, xử lý toàn vẹn dữ liệu giao dịch |
| **Database** | PostgreSQL + PostGIS | Quan hệ phức tạp + query tìm kiếm phòng theo bán kính địa lý |
| **Cache / Session** | Redis | Cache newsfeed, quản lý JWT session, rate limiting chống spam |
| **Realtime** | WebSocket (Spring WebSocket / STOMP) | Tính năng chat realtime giữa người dùng |
| **Map SDK** | Mapbox GL JS *(hoặc Leaflet.js + OpenStreetMap)* | Hiển thị bản đồ phòng trọ phía Frontend |

### Tích hợp Dịch vụ Bên thứ ba (Third-party Services)

| Mục đích | Dịch vụ | Ghi chú |
|---|---|---|
| **Thanh toán** | VNPay / MoMo / ZaloPay | Ưu tiên VNPay — phổ biến nhất tại VN |
| **KYC tự động** | VNPT eKYC hoặc VNeid API | Phase 2 — Phase 1 duyệt thủ công |
| **Email** | Resend hoặc SendGrid | OTP, thông báo giao dịch |
| **SMS / OTP** | VIETGUYS hoặc eSMS | Rẻ hơn Twilio cho thị trường VN |
| **Lưu trữ tệp** | Amazon S3 *(hoặc Cloudinary)* | Ảnh phòng, hợp đồng, CCCD |
| **Error Tracking** | Sentry *(Free tier)* | Theo dõi lỗi production |
| **Analytics** | Google Analytics 4 + Hotjar | Hành vi người dùng |

### Hạ tầng Vận hành (DevOps & Infrastructure)

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **Containerization** | Docker + Docker Compose | Đóng gói môi trường đồng nhất, dễ deploy |
| **Web Server** | NGINX | Reverse proxy, load balancing, phục vụ static files |
| **CI/CD** | GitHub Actions | Tự động test, build, deploy sau mỗi Sprint |
| **Bảo mật & CDN** | Cloudflare | DNS, SSL miễn phí, chống DDoS |
| **Cloud Server** | VPS Ubuntu — DigitalOcean / AWS EC2 | Tự quản lý Docker, tối ưu chi phí giai đoạn đầu |
| **Monitoring** | Sentry + Uptime Robot | Theo dõi lỗi và uptime server |

---

## 🗺️ Lộ trình phát triển (Roadmap)

```
Phase 1 — MVP (Tháng 1–3)          Phase 2 — Growth (Tháng 4–6)
─────────────────────────           ──────────────────────────────
✅ User Auth + KYC cơ bản           💳 Thanh toán đặt cọc online
✅ Đăng tin & Tìm kiếm phòng        📄 Hợp đồng điện tử
✅ Bản đồ tìm phòng                 👥 Tìm bạn ở ghép
✅ Chat realtime                    📰 Bảng tin cộng đồng
✅ Review & Rating                  🤖 KYC tự động (API)
✅ Admin Panel cơ bản               📊 Dashboard nâng cao
✅ Report/Flag hệ thống             💰 Bật monetization

Phase 3 — Scale (Tháng 7+)
───────────────────────────
📱 Mobile App (React Native)
🧠 Recommendation Engine
🌆 Mở rộng TP.HCM & Hà Nội
📈 Gói Subscription chủ trọ
```

---

## ⚖️ Tuân thủ pháp lý

> ⚠️ Đây là phần quan trọng thường bị bỏ qua trong các dự án cá nhân. Cần tìm hiểu kỹ trước khi thu thập dữ liệu người dùng thực.

| Lĩnh vực | Quy định liên quan | Hành động cần thực hiện |
|---|---|---|
| **Bảo vệ dữ liệu cá nhân** | Nghị định 13/2023/NĐ-CP | Có Chính sách bảo mật rõ ràng; xin consent khi thu thập CCCD |
| **Thanh toán trung gian** | Quy định NHNN về ví điện tử | Tích hợp qua cổng được cấp phép (VNPay, MoMo) thay vì tự xây |
| **Hợp đồng điện tử** | Luật Giao dịch điện tử 2023 | Hợp đồng cần đủ điều kiện pháp lý, xem xét chữ ký điện tử |
| **Lưu trữ CCCD/thông tin định danh** | Luật An ninh mạng 2018 | Mã hoá dữ liệu nhạy cảm, giới hạn quyền truy cập nội bộ |
| **Trách nhiệm nền tảng** | Nghị định 72/2013/NĐ-CP | Có quy trình xử lý nội dung vi phạm trong vòng 24 giờ |

---

## 🏁 Bắt đầu dự án (Getting Started)

### Yêu cầu môi trường

```bash
# Kiểm tra các công cụ cần thiết
docker --version       # >= 24.x
docker compose version # >= 2.x
node --version         # >= 20.x (LTS)
java --version         # >= 17 (LTS)
```

### Khởi chạy môi trường phát triển

```bash
# 1. Clone repository
git clone https://github.com/MaiLuong1906/RentSpace.git
cd RentSpace

# 2. Sao chép file cấu hình môi trường
cp .env.example .env
# → Điền các giá trị vào file .env

# 3. Khởi động toàn bộ hệ thống bằng Docker Compose
docker compose up -d

# 4. Kiểm tra trạng thái các container
docker compose ps
```

### Dịch vụ sau khi khởi chạy

| Dịch vụ | URL | Ghi chú |
|---|---|---|
| Frontend (Next.js) | http://localhost:3000 | |
| Backend API (Spring Boot) | http://localhost:8080 | |
| API Docs (Swagger UI) | http://localhost:8080/swagger-ui | |
| PostgreSQL | localhost:5432 | |
| Redis | localhost:6379 | |
| NGINX (Production proxy) | http://localhost:80 | |

---

## 📁 Cấu trúc thư mục dự án

```
rentspace/
├── frontend/               # Next.js + TypeScript
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities, API client
│   │   └── types/          # TypeScript interfaces
│   └── Dockerfile
│
├── backend/                # Java Spring Boot
│   ├── src/main/java/com/rentspace/
│   │   ├── config/         # Security, Swagger, WebSocket configs
│   │   ├── domain/         # Domain-driven modules (user, listing...)
│   │   ├── infrastructure/ # AWS S3, Email, JWT Token
│   │   └── common/         # Global exceptions, responses
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf          # Reverse proxy config
│
├── docker-compose.yml      # Môi trường dev
├── docker-compose.prod.yml # Môi trường production
├── .github/
│   └── workflows/
│       └── ci-cd.yml       # GitHub Actions pipeline
└── README.md
```

---

## 🤝 Đóng góp (Contributing)

Dự án hiện đang trong giai đoạn phát triển cá nhân. Mọi góp ý, issue hoặc pull request đều được hoan nghênh.

---

## 📄 Giấy phép

Dự án này hiện chưa có giấy phép mã nguồn mở. Mọi quyền được bảo lưu.

---

*Cập nhật lần cuối: 2025 — Tài liệu này sẽ được cập nhật liên tục theo từng Sprint.*
