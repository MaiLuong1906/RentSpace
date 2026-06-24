# CLAUDE.md — Backend

Bổ sung cho root `CLAUDE.md`. Đọc khi làm việc trong thư mục `backend/`.

---

## Cấu trúc package

```
com.rentspace/
├── controller/          # @RestController — chỉ nhận request + gọi service
├── service/             # @Service — toàn bộ business logic + @Transactional
├── repository/          # Spring Data JPA
├── entity/              # @Entity — không expose trực tiếp ra ngoài
├── dto/
│   ├── request/         # Input DTOs (validation với @Valid)
│   └── response/        # Output DTOs (mapper từ entity)
├── mapper/              # MapStruct — không map thủ công
├── security/            # JWT filter, SecurityConfig, UserDetails
├── config/              # Spring beans config
├── exception/           # Custom exceptions + GlobalExceptionHandler
├── aspect/              # AOP (SubscriptionLimitAspect hiện tại)
├── scheduler/           # @Scheduled jobs
└── domain/              # Bounded contexts Phase 3 (tất cả ✅)
    ├── payment/         # MoMo + VNPay gateway
    ├── payout/          # Payout service + AES-256 encrypted bank accounts
    ├── subscription/    # SubscriptionService, SubscriptionLimitAspect, ExpiryScheduler
    ├── listing/         # PriceSuggestionService, PriceBenchmarkScheduler, GeoSearch
    ├── notification/    # WebPushService, EmailService (Thymeleaf templates)
    ├── seo/             # SeoPageService, SitemapService
    └── analytics/       # LandlordAnalyticsService, materialized view refresh
```

---

## Flyway migrations

Phase 3 hoàn thành tại **V31**. Phase 4 bắt đầu từ **V32**.

| Migration | Nội dung | Sprint | Trạng thái |
|---|---|---|---|
| V23 | `payment_method_detail` JSONB trên `deposit_transactions` | P3-S0 | ✅ |
| V24 | `landlord_payout_accounts` + `payouts` | P3-S1 | ✅ |
| V25 | Thêm cột `processed_by` vào `payouts` (audit) | P3-S1 | ✅ |
| V26 | `subscription_plans` + `user_subscriptions` | P3-S2 | ✅ |
| V27 | `listings.room_type` + `price_benchmarks` | P3-S3 | ✅ |
| V28 | PostGIS extension + cột `geom` geometry trên `listings` | P3-S4 | ✅ |
| V29 | `web_push_subscriptions` | P3-S5 | ✅ |
| V30 | `seo_pages` | P3-S6 | ✅ |
| V31 | Materialized view `landlord_analytics_daily` | P3-S7 | ✅ |
| **V32+** | **Phase 4 bắt đầu tại đây** | P4 | ⏳ |

**Lưu ý schema kế thừa quan trọng cho Phase 4:**
- `V8` có bảng `reviews(listing_id, tenant_id)` — one-directional. Phase 4 cần tạo bảng `transaction_reviews` riêng (bidirectional, theo deposit), không được ALTER bảng cũ.
- `V14` đã thêm `ekyc_*` columns vào `users`. Phase 4 tạo bảng `user_verifications` riêng — coexist được, nhưng `user_verifications` là source of truth mới.
- `V17` có bảng `rental_contracts(contract_url)`. Phase 4 tạo bảng `contracts` mới với state machine đầy đủ — hai bảng tồn tại song song.

**KHÔNG** sửa file migration đã chạy. Tạo file mới nếu cần thay đổi.

---

## Patterns bắt buộc

```java
// Controller — không có logic
@RestController @RequestMapping("/api/v1/...")
@RequiredArgsConstructor @PreAuthorize("...")
public class XController {
    private final XService xService;
    @GetMapping public ResponseEntity<ApiResponse<XResponseDTO>> get(...) {
        return ResponseEntity.ok(ApiResponse.success(xService.get(...)));
    }
}

// Service — toàn bộ logic ở đây
@Service @RequiredArgsConstructor
@Transactional(readOnly = true)
public class XService {
    @Transactional  // override cho write operations
    public XResponseDTO create(...) { ... }
}

// Exception
throw new ResourceNotFoundException("X", id);
throw new BusinessException("Message tiếng Việt cho user");
```

---

## Test

```java
// Bắt buộc với @DataJpaTest
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)

// User class — luôn dùng FQN để tránh conflict với Spring Security
com.rentspace.domain.user.User user = ...;

// JSONB — không dùng String
@JdbcTypeCode(SqlTypes.JSON)
private Map<String, Object> paymentMethodDetail;
```

---

## API conventions

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <jwt>` header
- Response wrapper: `ApiResponse<T>` — không trả entity trực tiếp
- Pagination: `Page<T>` với `Pageable` parameter
- Error: `ApiResponse.error(message)` qua `GlobalExceptionHandler`
