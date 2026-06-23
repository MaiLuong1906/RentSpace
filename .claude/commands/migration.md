---
name: migration
description: Tạo Flyway migration đúng chuẩn cho RentSpace. Dùng khi thêm bảng mới, thêm cột, tạo index, hoặc seed dữ liệu cho Phase 3 (V23-V29).
---

# Flyway Migration Skill — RentSpace

## Quy tắc bất di bất dịch

1. **Không bao giờ sửa** file migration đã merged vào main
2. File mới phải tăng version liên tục: hiện tại đến **V22**, tiếp theo là **V23**
3. Mỗi file chỉ làm 1 việc — không nhồi nhiều thay đổi không liên quan
4. Mọi `ALTER TABLE` cho bảng lớn phải có `DEFAULT` hoặc `nullable` để tránh lock
5. `CREATE INDEX` nên dùng `CREATE INDEX CONCURRENTLY` trên bảng có data

## Format file

```
backend/src/main/resources/db/migration/
└── V{N}__{snake_case_description}.sql
```

Ví dụ: `V23__add_payment_method_detail_to_deposit_transactions.sql`

---

## Template theo use case

### Thêm bảng mới
```sql
-- V{N}__{description}.sql
-- {Mô tả ngắn mục đích}

CREATE TABLE {table_name} (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- các cột khác
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index cho query phổ biến
CREATE INDEX idx_{table}_{column} ON {table_name}({column});
CREATE INDEX idx_{table}_{col1}_{col2} ON {table_name}({col1}, {col2} DESC);

-- Unique constraint nếu cần
CREATE UNIQUE INDEX idx_{table}_unique ON {table_name}({col1}, {col2});
```

### Thêm cột vào bảng có data
```sql
-- Nullable trước (tránh table lock)
ALTER TABLE {table_name}
    ADD COLUMN {column_name} {TYPE};

-- Backfill nếu cần
UPDATE {table_name} SET {column_name} = {default_value} WHERE {column_name} IS NULL;

-- Sau khi backfill xong mới thêm constraint (optional, làm trong migration riêng)
-- ALTER TABLE {table_name} ALTER COLUMN {column_name} SET NOT NULL;
```

### JSONB column
```sql
ALTER TABLE {table_name}
    ADD COLUMN {column_name} JSONB;

-- Index GIN cho query trong JSONB
CREATE INDEX idx_{table}_{column}_gin ON {table_name} USING GIN ({column_name});
```

### Enum/Check constraint
```sql
ALTER TABLE {table_name}
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'));
```

### Seed data (INSERT)
```sql
INSERT INTO {table_name} ({col1}, {col2}, ...) VALUES
    ({val1}, {val2}, ...),
    ({val1}, {val2}, ...);
```

### Materialized View
```sql
CREATE MATERIALIZED VIEW {view_name} AS
SELECT
    -- columns
FROM {base_table}
LEFT JOIN {other_table} ON ...
WHERE ...
GROUP BY ...;

-- Unique index bắt buộc cho REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_{view_name}_pk ON {view_name}({unique_col1}, {unique_col2});
```

---

## Phase 3 — Migration map

| File | Status | Nội dung |
|---|---|---|
| `V23__add_payment_method_detail.sql` | ✅ Done | JSONB column trên `deposit_transactions` |
| `V24__create_payout_tables.sql` | ✅ Done | `landlord_payout_accounts` + `payouts` |
| `V25__create_price_benchmarks.sql` | ⏳ Sprint 3 | `price_benchmarks` + `listings.room_type` |
| `V26__create_subscription_tables.sql` | 🔄 Sprint 2 | `subscription_plans` + `user_subscriptions` |
| `V27__create_web_push_subscriptions.sql` | ⏳ Sprint 5 | `web_push_subscriptions` |
| `V28__create_seo_pages.sql` | ⏳ Sprint 6 | `seo_pages` |
| `V29__create_analytics_materialized_view.sql` | ⏳ Sprint 7 | Materialized view |

---

## Checklist trước khi tạo migration

- [ ] Version number đúng (V{N} = hiện tại + 1)?
- [ ] Tên file mô tả rõ nội dung (snake_case)?
- [ ] Bảng/cột mới có comment giải thích purpose?
- [ ] FK references có `ON DELETE` strategy phù hợp?
- [ ] Column có data lớn: dùng nullable + backfill riêng?
- [ ] Index được tạo cho FK columns và query patterns?
- [ ] Constraint CHECK cho enum-like columns?
- [ ] Unique index cho Materialized View (nếu cần CONCURRENTLY)?
