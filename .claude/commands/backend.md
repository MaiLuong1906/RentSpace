---
name: backend
description: RentSpace backend skill. Kích hoạt khi viết Controller, Service, Entity, Repository, Mapper, hoặc test. Enforce đúng layer pattern, naming, và Spring Boot conventions của project.
---

# RentSpace Backend Skill

> Áp dụng cho: Controller, Service, Repository, Entity, DTO, Mapper, Test, Flyway migration.
> Không thay thế việc đọc `.gemini/rules/coding-guidelines.md` cho guidelines đầy đủ.

---

## 0. LAYER CONTRACT (không được trộn)

```
Controller  → chỉ nhận request, validate @Valid, gọi Service, trả ApiResponse<T>
Service     → toàn bộ business logic, @Transactional, throw custom exception
Repository  → Spring Data JPA, custom @Query, không logic nào
Entity      → @Entity, không bao giờ trả ra ngoài (dùng DTO)
Mapper      → MapStruct, không map thủ công
```

---

## 1. TEMPLATE CHUẨN

### Controller
```java
@RestController
@RequestMapping("/api/v1/{resource}")
@RequiredArgsConstructor
@Tag(name = "{Resource} API", description = "...")
public class {Resource}Controller {

    private final {Resource}Service {resource}Service;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'LANDLORD', 'ADMIN')")
    @Operation(summary = "...")
    public ResponseEntity<ApiResponse<{Resource}ResponseDTO>> get{Resource}(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            ApiResponse.success({resource}Service.get{Resource}ById(id, userDetails.getUsername()))
        );
    }
}
```

### Service
```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)  // default read-only
public class {Resource}Service {

    private final {Resource}Repository {resource}Repository;
    private final {Resource}Mapper {resource}Mapper;

    public {Resource}ResponseDTO get{Resource}ById(Long id, String requesterEmail) {
        return {resource}Repository.findById(id)
            .map({resource}Mapper::toResponseDTO)
            .orElseThrow(() -> new ResourceNotFoundException("{Resource}", id));
    }

    @Transactional  // override cho write
    public {Resource}ResponseDTO create{Resource}(Create{Resource}Request request, String ownerEmail) {
        // business logic...
    }
}
```

### Repository
```java
public interface {Resource}Repository extends JpaRepository<{Resource}, Long> {

    // Dùng JPQL khi có thể
    @Query("SELECT r FROM {Resource} r WHERE r.owner.email = :email AND r.status = :status")
    List<{Resource}> findByOwnerEmailAndStatus(
        @Param("email") String email,
        @Param("status") {Resource}Status status
    );

    // Native query chỉ khi cần PostGIS hoặc JSONB
    @Query(value = "SELECT * FROM {table} WHERE ST_DWithin(location, ST_MakePoint(:lon, :lat)::geography, :radius)",
           nativeQuery = true)
    List<{Resource}> findNearby(@Param("lon") double lon, @Param("lat") double lat, @Param("radius") double radius);
}
```

### MapStruct Mapper
```java
@Mapper(componentModel = "spring")
public interface {Resource}Mapper {
    {Resource}ResponseDTO toResponseDTO({Resource} entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    {Resource} toEntity(Create{Resource}Request request);
}
```

### DTO
```java
// Request DTO — validation annotations
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Create{Resource}Request {
    @NotBlank(message = "Tên không được để trống")
    @Size(min = 5, max = 200, message = "Tên phải từ 5-200 ký tự")
    private String name;

    @NotNull @Positive(message = "Giá phải lớn hơn 0")
    private Long price;
}

// Response DTO — không expose internal state
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class {Resource}ResponseDTO {
    private Long id;
    private String name;
    private Long price;
    private LocalDateTime createdAt;
}
```

---

## 2. ENTITY CONVENTIONS

```java
@Entity @Table(name = "{table_name}")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class {Resource} {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relationship — luôn LAZY
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // JSONB column
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

---

## 3. EXCEPTION HANDLING

```java
// Throw — không dùng RuntimeException trực tiếp
throw new ResourceNotFoundException("Listing", id);
throw new BusinessException("Chủ nhà chưa hoàn thành xác minh KYC");
throw new UnauthorizedException("Bạn không có quyền thực hiện hành động này");
throw new DuplicateException("Email đã được sử dụng");

// Custom exception pattern
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " không tìm thấy với id: " + id);
    }
}
```

---

## 4. SECURITY PATTERNS

```java
// Lấy user hiện tại
@AuthenticationPrincipal UserDetails userDetails
String email = userDetails.getUsername();  // email là username

// Method-level security
@PreAuthorize("hasRole('LANDLORD')")
@PreAuthorize("hasAnyRole('ADMIN', 'LANDLORD')")
@PreAuthorize("@securityService.isOwner(#id, authentication)")

// Luôn dùng FQN cho User entity trong test và context gây ambiguity
com.rentspace.domain.user.User user = ...;
```

---

## 5. TEST PATTERNS

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional  // rollback sau mỗi test
class {Resource}ControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void create{Resource}_whenValid_returns201() throws Exception {
        // given
        Create{Resource}Request request = Create{Resource}Request.builder()...build();

        // when & then
        mockMvc.perform(post("/api/v1/{resources}")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_LANDLORD"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true));
    }
}

// @DataJpaTest — bắt buộc thêm annotation này
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class {Resource}RepositoryTest { ... }
```

---

## 6. ANTI-PATTERNS CẤM

| Cấm | Thay bằng |
|---|---|
| `@Transactional` ở Controller | Chỉ ở Service |
| Trả `Entity` trực tiếp | Luôn dùng DTO |
| `findAll()` không limit | `findAll(Pageable)` |
| `Optional.get()` | `.orElseThrow()` |
| Map thủ công | MapStruct |
| `@DataJpaTest` thiếu `@AutoConfigureTestDatabase` | Thêm annotation |
| Import `User` gây conflict | FQN: `com.rentspace.domain.user.User` |
| `String` cho JSONB column | `@JdbcTypeCode(SqlTypes.JSON)` |
| Raw SQL khi JPA đủ dùng | JPQL `@Query` |

---

## 7. PHASE 3 CONTEXT

**Migration hiện tại:** V22 (đã merged)
**Subscription entities:** `UserSubscription`, `SubscriptionPlan` (V26 done)
**Aspect:** `SubscriptionLimitAspect` tại `domain/subscription/SubscriptionLimitAspect.java`
**Payout entities:** `Payout`, `LandlordPayoutAccount` (V24, done)
**Payment gateways:** `MomoGateway`, `VnpayGateway` tại `infrastructure/payment/` (done)

Khi tạo entity mới cho Phase 3: đặt trong `domain/{subdomain}/` thay vì `entity/` chung.
