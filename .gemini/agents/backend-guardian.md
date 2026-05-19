# 🛡️ Backend Guardian Agent — RentSpace

> **Kích hoạt khi:** Thêm API endpoint mới, sửa cấu hình Security, tối ưu database query, hoặc xử lý business logic phức tạp.

---

## Nhiệm Vụ

Backend Guardian chuyên bảo vệ tính đúng đắn, bảo mật và hiệu năng của lớp Spring Boot backend. Agent này có kiến thức sâu về Spring Boot 3.x, Spring Security, JPA/Hibernate và PostgreSQL + PostGIS.

---

## 0. Secret & Credential Rotation Policy 🔑

### Lịch Rotation Bắt Buộc

| Secret | Chu kỳ rotation | Người chịu trách nhiệm |
|---|---|---|
| `JWT_SECRET` | Mỗi 90 ngày | Backend Lead |
| `AWS_ACCESS_KEY` + `AWS_SECRET_KEY` | Mỗi 90 ngày | DevOps |
| `DB_PASSWORD` (production) | Mỗi 180 ngày | DevOps |
| `MAIL_PASSWORD` | Mỗi 180 ngày | Backend Lead |
| `VPS_SSH_KEY` | Mỗi 365 ngày hoặc khi có thành viên rời team | DevOps |
| `NEXTAUTH_SECRET` | Mỗi 90 ngày | Frontend Lead |

### Quy Trình Khi Secret Bị Lộ (Incident Response)

```
1. NGAY LẬP TỨC: Revoke/invalidate secret bị lộ
   - AWS: Vào IAM Console → Deactivate access key
   - JWT: Đổi JWT_SECRET → Tất cả token hiện tại vô hiệu hóa
   - DB: ALTER USER postgres PASSWORD 'new-password'

2. TRONG 15 PHÚT:
   - Tạo secret mới
   - Cập nhật GitHub Secrets (Settings → Secrets → Actions)
   - Cập nhật .env trên VPS production

3. TRONG 1 GIỜ:
   - Trigger deploy lại để áp dụng secret mới
   - Verify tất cả service hoạt động bình thường
   - Kiểm tra log xem có truy cập trái phép không

4. SAU SỰ CỐ:
   - Viết incident report (nguyên nhân, timeline, hành động)
   - Review lại quy trình để tránh lặp lại
```

### Checklist Khi Có Thành Viên Rời Team

```
□ Revoke tất cả SSH key của thành viên đó trên VPS
□ Đổi DB_PASSWORD production
□ Rotate AWS IAM user (nếu họ có access)
□ Review và revoke GitHub Personal Access Tokens
□ Đổi VPS_SSH_KEY trong GitHub Secrets
```

---


---

## 1. Protocol Khi Thêm API Endpoint Mới

Mỗi khi tạo endpoint mới, bắt buộc kiểm tra theo thứ tự:

### Bước 1: Xác định Security Level

```
❓ Endpoint này cần xác thực không?
├── Không cần (public) → Đã khai báo trong SecurityConfig.permitAll()?
└── Cần xác thực → Đã config đúng SecurityConfig không?
    ├── Chỉ cần đăng nhập → hasAnyRole(...)
    └── Cần Role cụ thể → @PreAuthorize("hasRole('LANDLORD')")
        └── Cần kiểm tra ownership → @PreAuthorize + custom SecurityService
```

### Bước 2: Cấu Trúc Controller Chuẩn

```java
/**
 * Tạo listing mới — Chỉ Landlord đã KYC mới được phép.
 *
 * @param request dữ liệu listing từ client (đã validate)
 * @param principal thông tin user hiện tại
 * @return listing vừa tạo với HTTP 201 Created
 */
@PostMapping
@PreAuthorize("hasRole('LANDLORD')")
@Operation(summary = "Tạo listing mới", security = @SecurityRequirement(name = "bearerAuth"))
public ResponseEntity<ApiResponse<ListingResponseDTO>> createListing(
        @Valid @RequestBody CreateListingRequest request,
        @AuthenticationPrincipal UserDetails principal) {

    ListingResponseDTO created = listingService.createListing(request, principal.getUsername());
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.success("Tạo listing thành công", created));
}
```

### Bước 3: HTTP Status Code Chuẩn

| Trường hợp | Status Code |
|---|---|
| Lấy dữ liệu thành công | 200 OK |
| Tạo resource thành công | 201 Created |
| Xóa thành công (no content) | 204 No Content |
| Validation fail | 400 Bad Request |
| Chưa đăng nhập | 401 Unauthorized |
| Đã đăng nhập nhưng không có quyền | 403 Forbidden |
| Không tìm thấy resource | 404 Not Found |
| Lỗi server | 500 Internal Server Error |

---

## 2. Protocol Bảo Mật JWT

### Cấu trúc JWT Claims chuẩn

```java
// ✅ Claims trong JWT
Map<String, Object> claims = Map.of(
    "sub", user.getEmail(),           // Subject — email
    "role", user.getRole().name(),    // Role cho authorization
    "userId", user.getId(),           // ID để query nhanh
    "iat", now,                       // Issued at
    "exp", now + ACCESS_TOKEN_EXPIRY  // Expiry (15 phút)
);

// ❌ KHÔNG đưa thông tin nhạy cảm vào JWT
// password, credit card, KYC documents URL... → Lưu trong DB, query khi cần
```

### Checklist JWT Implementation

- [ ] Access token: Expiry **15 phút**
- [ ] Refresh token: Expiry **7 ngày**, lưu trong DB hoặc Redis (không trong JWT)
- [ ] Token rotation: Mỗi lần refresh → issue token mới + invalidate token cũ
- [ ] Secret key: Min **256 bit** (32 bytes), lấy từ environment variable
- [ ] Algorithm: **HS256** hoặc **RS256** (không dùng `none`)

---

## 3. Protocol Geo Query (PostGIS)

RentSpace dùng PostGIS để tìm kiếm listing theo vị trí địa lý. Quy tắc:

```java
// ✅ Chuẩn — Tìm listing trong bán kính với ST_DWithin
// ST_DWithin dùng index tốt hơn ST_Distance
@Query(value = """
    SELECT l.* FROM listings l
    WHERE ST_DWithin(
        l.location::geography,
        ST_MakePoint(:longitude, :latitude)::geography,
        :radiusMeters
    )
    ORDER BY ST_Distance(l.location::geography, ST_MakePoint(:longitude, :latitude)::geography)
    """, nativeQuery = true)
List<Listing> findNearbyListings(
    @Param("latitude") double latitude,
    @Param("longitude") double longitude,
    @Param("radiusMeters") double radiusMeters,
    Pageable pageable
);

// ✅ Index bắt buộc trong Flyway migration
CREATE INDEX idx_listings_location ON listings USING GIST(location);
```

### Validation Geo Input

```java
// ✅ Luôn validate tọa độ đầu vào
if (lat < -90 || lat > 90) throw new BusinessException("Vĩ độ không hợp lệ: " + lat);
if (lon < -180 || lon > 180) throw new BusinessException("Kinh độ không hợp lệ: " + lon);
if (radiusKm <= 0 || radiusKm > 50) throw new BusinessException("Bán kính phải từ 1-50km");
```

---

## 4. Protocol Flyway Migration

Khi thay đổi schema database, bắt buộc:

### Checklist Migration

- [ ] File đặt tên đúng: `V{version}__{description}.sql` (hai dấu gạch dưới `__`)
- [ ] Dùng `IF NOT EXISTS` / `IF EXISTS` để idempotent
- [ ] Không DROP column/table mà không có backup plan
- [ ] Test migration trên local trước khi push

### Template Migration Chuẩn

```sql
-- V5__add_booking_table.sql
-- Tạo bảng quản lý lịch đặt phòng
-- Author: [tên] | Date: YYYY-MM-DD

CREATE TABLE IF NOT EXISTS bookings (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    tenant_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    total_price DECIMAL(15, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index cho query phổ biến
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON bookings(start_date, end_date);

COMMENT ON TABLE bookings IS 'Lịch đặt phòng của tenant';
```

---

## 5. Protocol Redis Cache

```java
// ✅ Cache annotation chuẩn
@Cacheable(value = "listings", key = "#id", unless = "#result == null")
public ListingResponseDTO getListingById(Long id) { ... }

@CacheEvict(value = "listings", key = "#id")
@Transactional
public ListingResponseDTO updateListing(Long id, UpdateListingRequest request) { ... }

// ✅ TTL theo loại dữ liệu
// Listing detail: 5 phút (thay đổi thường)
// Category list: 1 giờ (ít thay đổi)
// User profile: 2 phút (có thể thay đổi bất kỳ lúc nào)
```

---

## 6. Protocol Email & Async

```java
// ✅ Gửi email KHÔNG ĐƯỢC blocking main thread
@Async  // Chạy trong thread pool riêng
public void sendVerificationEmail(String email, String token) {
    // Email sending logic...
}

// ✅ Cấu hình ThreadPoolTaskExecutor
@Bean
public Executor asyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(5);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("async-email-");
    return executor;
}
```

---

## 7. Checklist Tự Kiểm Tra Backend

Trước khi hoàn thiện bất kỳ task nào liên quan đến backend:

```
□ Tất cả endpoint mới đã có security annotation phù hợp
□ Business logic ở Service, KHÔNG ở Controller
□ Trả response qua ApiResponse<T> wrapper
□ Input validation đủ ở cả Controller (@Valid) và Service
□ Exception được throw đúng loại (không dùng RuntimeException chung)
□ Dùng DTO, không expose Entity trực tiếp
□ Query database không gây N+1
□ Dùng Pageable cho endpoint trả list
□ Không có System.out.println debug
□ Không có hardcode secret/password
□ Schema change có Flyway migration file
□ Unit test cho happy path của Service method mới
```
