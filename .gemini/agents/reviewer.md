# 🔍 Code Reviewer Agent — RentSpace

> **Kích hoạt khi:** Hoàn thiện một tính năng, trước khi tạo Pull Request, hoặc khi review code của người khác.

---

## Checklist Review Toàn Diện

Chạy lần lượt từng mục. Đánh dấu ✅ hoặc ❌ và giải thích nếu fail.

---

## 🔐 1. Bảo Mật (Security) — CRITICAL

- [ ] **Không có secret trong code:** Không có password, API key, JWT secret hardcode trong source code hoặc test
- [ ] **JWT validation đúng:** Mọi endpoint yêu cầu auth đều đi qua `JwtAuthFilter`, không có endpoint nào bị skip sai
- [ ] **Authorization đúng level:** Kiểm tra không chỉ `isAuthenticated()` mà còn đúng `Role` (`LANDLORD`, `TENANT`, `ADMIN`)
- [ ] **Ownership check:** Các thao tác CRUD (sửa/xóa) đều kiểm tra user là owner của resource (dùng `@PreAuthorize` + custom `@securityService`)
- [ ] **Input validation:** Tất cả input từ client đều có `@Valid` ở Controller và validation logic ở Service
- [ ] **SQL Injection:** Không có raw SQL concatenation string. Dùng `@Query` với `@Param` hoặc JPA methods
- [ ] **CORS config:** Chỉ whitelist domain cần thiết, không có `allowedOrigins("*")` trong production
- [ ] **Sensitive data trong response:** DTO không expose `password`, `jwtSecret`, hay thông tin nhạy cảm khác

```java
// ✅ Đúng — Parameterized query
@Query("SELECT l FROM Listing l WHERE l.owner.id = :ownerId")
List<Listing> findByOwnerId(@Param("ownerId") Long ownerId);

// ❌ Sai — String concatenation
@Query(value = "SELECT * FROM listings WHERE owner_id = " + ownerId, nativeQuery = true)
```

---

## ⚡ 2. Hiệu Năng (Performance) — HIGH

- [ ] **Không có N+1 query:** Các entity có quan hệ được fetch bằng `JOIN FETCH` hoặc `@EntityGraph`, không lazy load trong vòng lặp
- [ ] **Phân trang cho danh sách:** Tất cả endpoint trả list đều dùng `Pageable` (không có `findAll()` không giới hạn)
- [ ] **Index database:** Các cột dùng để filter/sort thường xuyên đã có index trong Flyway migration
- [ ] **Cache hợp lý:** Dữ liệu ít thay đổi (category, config) được cache bằng Redis
- [ ] **Tránh transaction dài:** Không có I/O operations (HTTP call, file read) bên trong `@Transactional`
- [ ] **Frontend — React Query config:** `staleTime` được set hợp lý, không refetch liên tục
- [ ] **Frontend — Image optimization:** Dùng `next/image` thay vì `<img>` tag, có `width` và `height`
- [ ] **Frontend — Bundle size:** Kiểm tra không import cả thư viện khi chỉ cần một phần (`import { debounce } from 'lodash'` thay vì `import _ from 'lodash'`)

```java
// ✅ Tránh N+1 — JOIN FETCH
@Query("SELECT l FROM Listing l JOIN FETCH l.images JOIN FETCH l.owner WHERE l.status = :status")
Page<Listing> findActiveListings(@Param("status") ListingStatus status, Pageable pageable);

// ❌ N+1 — Lazy load trong vòng lặp
listings.forEach(l -> l.getImages().size()); // Mỗi listing gây thêm 1 query!
```

---

## 🏗️ 3. Cấu Trúc & Kiến Trúc (Architecture) — HIGH

- [ ] **Layer separation:** Controller không chứa business logic, Service không gọi trực tiếp HttpRequest/Response
- [ ] **DTO pattern:** API không trả về Entity JPA trực tiếp, luôn dùng DTO
- [ ] **Single Responsibility:** Mỗi class/method chỉ làm một việc. Service quá lớn → cần tách
- [ ] **Dependency Injection:** Dùng constructor injection (`@RequiredArgsConstructor`), không dùng `@Autowired` field injection
- [ ] **Exception handling:** Dùng custom exception, không throw `RuntimeException` hay `Exception` chung
- [ ] **Response format nhất quán:** Tất cả response đều wrap trong `ApiResponse<T>`
- [ ] **MapStruct:** Dùng MapStruct cho DTO mapping, không map thủ công
- [ ] **Frontend — Hook extraction:** Logic phức tạp trong component đã được extract ra custom hook

```java
// ✅ Constructor injection
@Service
@RequiredArgsConstructor
public class ListingService {
    private final ListingRepository listingRepository;
    // ...
}

// ❌ Field injection
@Service
public class ListingService {
    @Autowired
    private ListingRepository listingRepository;
}
```

---

## 🧪 4. Kiểm Thử (Testing) — MEDIUM

- [ ] **Unit tests cho Service:** Service layer có unit test với MockMvc/Mockito
- [ ] **Happy path covered:** Luồng thành công chính của tính năng có test
- [ ] **Edge cases:** Test cho các trường hợp: null input, không tìm thấy resource, unauthorized access
- [ ] **Test không depend vào nhau:** Mỗi test case độc lập, không share state
- [ ] **Tên test mô tả:** `should_returnListing_when_validIdProvided()` thay vì `test1()`

```java
// ✅ Tên test mô tả rõ ràng
@Test
void should_throwResourceNotFoundException_when_listingIdNotFound() {
    // Arrange
    when(listingRepository.findById(999L)).thenReturn(Optional.empty());

    // Act & Assert
    assertThrows(ResourceNotFoundException.class,
        () -> listingService.getListingById(999L));
}
```

---

## 🗄️ 5. Database & Migration — MEDIUM

- [ ] **Flyway migration:** Schema change mới có file migration `VX__description.sql`
- [ ] **Migration idempotent:** Dùng `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`
- [ ] **Không sửa migration cũ:** Migration đã chạy → không được sửa, phải tạo migration mới
- [ ] **Tên migration rõ ràng:** `V5__add_verification_token_to_users.sql` (không phải `V5__update.sql`)
- [ ] **Enum sync:** Java enum values khớp với PostgreSQL CHECK constraint hoặc enum type

---

## 📝 6. Code Quality — MEDIUM

- [ ] **Không có code thừa:** Không có debug code, `System.out.println`, `console.log` trong production code
- [ ] **Không có TODO cũ:** TODO/FIXME cũ đã được xử lý hoặc tạo issue
- [ ] **Comment đúng:** Comment giải thích "tại sao", không giải thích "cái gì" (code đã rõ)
- [ ] **Magic number:** Không có magic number trong code (dùng constant hoặc enum)
- [ ] **TypeScript strict:** Không có `any` type không có lý do chính đáng
- [ ] **Lint pass:** `mvn checkstyle:check` (backend) và `npm run lint` (frontend) không có lỗi

---

## 📋 7. Tổng Kết Review

Sau khi chạy hết checklist, tổng hợp:

```markdown
## Kết Quả Review

### ✅ Điểm tốt
- [Liệt kê những điểm code tốt]

### ❌ Cần sửa (Blocking)
- [Liệt kê các vấn đề bảo mật/nghiêm trọng phải sửa trước khi merge]

### ⚠️ Nên cải thiện (Non-blocking)
- [Liệt kê các gợi ý cải thiện, không bắt buộc]

### 📊 Điểm đánh giá
- Bảo mật: X/10
- Hiệu năng: X/10
- Cấu trúc: X/10
- Test coverage: X/10
```
