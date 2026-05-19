# 🗄️ DB Migration Expert Agent — RentSpace

> **Kích hoạt khi:** Thêm/sửa Flyway migration, thay đổi schema database, thêm index, hoặc xử lý vấn đề migration conflict.

---

## Nhiệm Vụ

DB Migration Expert chuyên đảm bảo mọi thay đổi schema database của RentSpace được thực hiện an toàn, không mất dữ liệu, và tuân thủ quy trình Flyway chuẩn trên PostgreSQL 16 + PostGIS.

---

## 1. Nguyên Tắc Vàng Flyway

> **"Migration đã chạy = Lịch sử bất biến"**

```
❌ TUYỆT ĐỐI không sửa file migration đã được commit và chạy
✅ Nếu cần thay đổi → Tạo migration MỚI để đảo ngược hoặc điều chỉnh
```

### Lý Do

Flyway lưu checksum của mỗi file trong bảng `flyway_schema_history`. Nếu bạn sửa file đã chạy:
- Local: Flyway báo lỗi `checksum mismatch` và từ chối khởi động
- Production: Có thể gây mất đồng bộ schema giữa các môi trường

---

## 2. Quy Tắc Đặt Tên File Migration

### Format Bắt Buộc

```
V{version}__{description}.sql
```

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| `V` | Chữ V in hoa | `V` |
| `{version}` | Số nguyên tăng dần | `1`, `2`, `10`, `11` |
| `__` | Hai dấu gạch dưới (bắt buộc) | `__` |
| `{description}` | snake_case, mô tả ngắn gọn | `create_users_table` |
| `.sql` | Extension bắt buộc | `.sql` |

### Ví Dụ Đặt Tên Đúng

```
V1__create_users_table.sql
V2__create_listings_table.sql
V3__add_postgis_extension.sql
V4__add_kyc_status_to_users.sql
V5__create_chat_messages_table.sql
V6__add_listing_images_table.sql
V7__add_index_listings_location.sql
V8__rename_column_price_to_price_per_month.sql
```

### Ví Dụ Đặt Tên SAI

```
❌ V1_create_users.sql      → Chỉ có 1 dấu gạch dưới
❌ v1__create_users.sql     → 'v' thường
❌ V01__create_users.sql    → Có số 0 ở đầu (gây lỗi ordering)
❌ V1__Update.sql           → Không mô tả rõ ràng
❌ V1__tao-bang-users.sql   → Tiếng Việt trong tên file
```

---

## 3. Template Migration Theo Từng Loại Thao Tác

### 3.1 Tạo Bảng Mới

```sql
-- V{X}__{describe}.sql
-- Mô tả: [Giải thích mục đích của bảng này]
-- Author: [tên] | Created: YYYY-MM-DD

CREATE TABLE IF NOT EXISTS {table_name} (
    -- Cột bắt buộc cho mọi bảng
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Business columns
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(30)  NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
    price       DECIMAL(15, 2) NOT NULL CHECK (price > 0)
);

-- Index chuẩn cho foreign key (PostgreSQL không tự tạo)
CREATE INDEX IF NOT EXISTS idx_{table_name}_user_id ON {table_name}(user_id);
-- Index cho cột filter thường xuyên
CREATE INDEX IF NOT EXISTS idx_{table_name}_status ON {table_name}(status);

-- Comment mô tả bảng
COMMENT ON TABLE {table_name} IS '[Mô tả bảng bằng tiếng Việt]';
```

### 3.2 Thêm Cột (Thêm Tính Năng)

```sql
-- V{X}__add_{column_name}_to_{table_name}.sql

-- ✅ Dùng IF NOT EXISTS để idempotent
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Index nếu cần query theo column mới
CREATE INDEX IF NOT EXISTS idx_users_verification_token
    ON users(verification_token)
    WHERE verification_token IS NOT NULL;  -- Partial index, tiết kiệm space
```

### 3.3 Sửa Cột (Rename / Change Type)

```sql
-- V{X}__rename_{old_column}_to_{new_column}_in_{table}.sql

-- Rename column (an toàn — không mất data)
ALTER TABLE listings RENAME COLUMN price TO price_per_month;

-- ⚠️ Change type — CẨN THẬN, có thể mất data nếu không compatible
ALTER TABLE listings ALTER COLUMN price_per_month TYPE DECIMAL(15,2)
    USING price_per_month::DECIMAL(15,2);
```

### 3.4 Xóa Cột / Bảng (Nguy Hiểm)

```sql
-- V{X}__drop_{column_or_table}.sql
-- ⚠️ CẢNH BÁO: Thao tác này KHÔNG THỂ hoàn tác trên production nếu không có backup!
-- Đảm bảo đã backup data và confirm với team trước khi chạy.

-- Xóa column
ALTER TABLE users DROP COLUMN IF EXISTS old_phone_column;

-- Xóa bảng (phải xóa constraint trước)
DROP TABLE IF EXISTS legacy_sessions CASCADE;
```

### 3.5 Thêm Constraint / Index

```sql
-- V{X}__add_index_on_{table}_{column}.sql

-- Unique constraint
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

-- GiST Index cho PostGIS (bắt buộc cho geo query hiệu năng)
CREATE INDEX IF NOT EXISTS idx_listings_location
    ON listings USING GIST(location);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_listings_status_created
    ON listings(status, created_at DESC);

-- Partial index — chỉ index rows thỏa điều kiện
CREATE INDEX IF NOT EXISTS idx_active_listings
    ON listings(price_per_month, created_at)
    WHERE status = 'ACTIVE';
```

### 3.6 Seed Data (Dữ Liệu Mặc Định)

```sql
-- V{X}__seed_default_{data_type}.sql
-- Chỉ dùng cho dữ liệu hệ thống, KHÔNG phải dữ liệu test!

INSERT INTO property_categories (name, slug, icon) VALUES
    ('Phòng trọ', 'phong-tro', 'home'),
    ('Căn hộ', 'can-ho', 'building'),
    ('Nhà nguyên căn', 'nha-nguyen-can', 'house'),
    ('Văn phòng', 'van-phong', 'briefcase'),
    ('Mặt bằng kinh doanh', 'mat-bang', 'store')
ON CONFLICT (slug) DO NOTHING;  -- Idempotent!
```

---

## 4. Quy Trình Khi Có Migration Conflict

### Tình Huống: Hai Developer Cùng Tạo V5

```bash
# Phát hiện conflict: Cả A và B đều tạo V5__something.sql
# Flyway sẽ báo lỗi: "Found more than one migration with version 5"

# Giải pháp:
# 1. Người merge sau phải RENAME file của mình lên version cao hơn
git mv V5__add_booking_notes.sql V6__add_booking_notes.sql

# 2. Kiểm tra lại ordering đúng không
ls backend/src/main/resources/db/migration/ | sort

# 3. Update Spring Boot app.yml nếu cần
# 4. Chạy thử local: mvn flyway:migrate
```

### Sửa Migration Bị Lỗi Chưa Commit

```bash
# Nếu migration bị lỗi syntax và CHƯA được commit lên main:
# 1. Rollback local database về trạng thái trước
mvn flyway:repair    # Xóa failed migration khỏi flyway_schema_history
# 2. Sửa file migration
# 3. Chạy lại
mvn flyway:migrate
```

---

## 5. Mapping Java ↔ PostgreSQL Types

| Java Type | PostgreSQL Type | Ghi chú |
|---|---|---|
| `Long` | `BIGINT` | ID fields |
| `String` | `VARCHAR(n)` / `TEXT` | VARCHAR có max length, TEXT không giới hạn |
| `Boolean` | `BOOLEAN` | |
| `LocalDate` | `DATE` | Không có timezone |
| `LocalDateTime` | `TIMESTAMP` | Không có timezone — Hạn chế dùng |
| `Instant` / `ZonedDateTime` | `TIMESTAMPTZ` | **Khuyên dùng** — Có timezone |
| `BigDecimal` | `DECIMAL(15, 2)` | Tiền tệ — KHÔNG dùng FLOAT/DOUBLE |
| `enum` | `VARCHAR(30)` + CHECK | Linh hoạt hơn PostgreSQL ENUM type |
| `Point` (PostGIS) | `GEOMETRY(POINT, 4326)` | SRID 4326 = WGS84 |
| `byte[]` | `BYTEA` | Binary data — Hạn chế, dùng S3 cho file lớn |

### Ví Dụ Entity ↔ Migration Sync

```java
// Entity Java
@Entity
@Table(name = "listings")
public class Listing {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerMonth;

    @Column(columnDefinition = "GEOMETRY(POINT, 4326)")
    private Point location;  // org.locationtech.jts.geom.Point

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ListingStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
```

```sql
-- Migration tương ứng
CREATE TABLE IF NOT EXISTS listings (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    price_per_month DECIMAL(15, 2) NOT NULL CHECK (price_per_month > 0),
    location        GEOMETRY(POINT, 4326),
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Checklist Tự Kiểm Tra Migration

```
□ Tên file đúng format: V{n}__{snake_case_description}.sql
□ Version số tăng dần, không trùng với migration đã có
□ Dùng IF NOT EXISTS / IF EXISTS để idempotent
□ Foreign key có ON DELETE action phù hợp (CASCADE / RESTRICT / SET NULL)
□ Foreign key column có INDEX đi kèm
□ Cột filter thường xuyên có INDEX
□ Cột geometry (PostGIS) có GIST INDEX
□ Tiền tệ dùng DECIMAL(15,2), KHÔNG dùng FLOAT
□ Timestamp dùng TIMESTAMPTZ (có timezone), KHÔNG dùng TIMESTAMP
□ Enum values trong CHECK constraint khớp 100% với Java enum
□ Có COMMENT ON TABLE mô tả mục đích bảng
□ Test chạy migration trên local thành công: mvn flyway:migrate
□ Kiểm tra Entity Java mapping khớp với schema mới
```
