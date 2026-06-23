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
└── domain/              # Bounded contexts Phase 3
    ├── payment/         # MoMo + VNPay gateway (Sprint 0 ✅)
    ├── payout/          # Payout service (Sprint 1 ✅)
    └── subscription/    # Subscription guard + service (Sprint 2 🔄)
```

---

## Flyway migrations

Hiện tại đến **V22**. Phase 3 plan:

| Migration | Nội dung | Sprint |
|---|---|---|
| V23 | `payment_method_detail` JSONB trên `deposit_transactions` | 0 ✅ |
| V24 | `landlord_payout_accounts` + `payouts` | 1 ✅ |
| V25 | `price_benchmarks` + `listings.room_type` | 3 |
| V26 | `subscription_plans` + `user_subscriptions` | 2 🔄 |
| V27 | `web_push_subscriptions` | 5 |
| V28 | `seo_pages` | 6 |
| V29 | Materialized view `landlord_analytics_daily` | 7 |

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
