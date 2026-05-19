# 🌐 Language Protocol — RentSpace

> Quy định về ngôn ngữ giao tiếp trong toàn bộ dự án.

---

## 1. Nguyên Tắc Cốt Lõi

**Tiếng Việt là ngôn ngữ chính** cho mọi tài liệu, comment giải thích và giao tiếp nội bộ.  
**Tiếng Anh là ngôn ngữ của code** — tất cả code, tên biến, tên class, API, commit message đều bằng tiếng Anh.

---

## 2. Quy Định Theo Từng Loại Nội Dung

| Loại nội dung | Ngôn ngữ | Ví dụ |
|---|---|---|
| Tên class, method, variable | 🇬🇧 Tiếng Anh | `ListingService`, `getUserById()`, `isKycVerified` |
| Tên file & thư mục | 🇬🇧 Tiếng Anh | `ListingController.java`, `create-listing-form.tsx` |
| API endpoint & JSON key | 🇬🇧 Tiếng Anh | `/api/v1/listings`, `{ "pricePerMonth": 5000000 }` |
| Database table & column | 🇬🇧 Tiếng Anh (snake_case) | `rental_listings`, `kyc_status`, `created_at` |
| Git commit message | 🇬🇧 Tiếng Anh | `feat(auth): add Google OAuth login` |
| Git branch name | 🇬🇧 Tiếng Anh | `feature/listing-search-filter` |
| Comment kỹ thuật (giải thích logic) | 🇻🇳 Tiếng Việt | `// Dùng native query vì PostGIS chưa hỗ trợ JPQL` |
| Javadoc / JSDoc | 🇻🇳 Tiếng Việt | `@param lat vĩ độ điểm trung tâm` |
| Error message trả về client | 🇻🇳 Tiếng Việt | `"Chủ nhà chưa hoàn thành xác minh KYC"` |
| UI text / Toast / Label | 🇻🇳 Tiếng Việt | `"Đăng tin thành công"`, `"Lọc kết quả"` |
| README & tài liệu dự án | 🇻🇳 Tiếng Việt (chính) | File này và GEMINI.md |
| AI Agent response | 🇻🇳 Tiếng Việt | Câu trả lời của Gemini AI |

---

## 3. Quy Tắc Comment Chi Tiết

### 3.1 Backend (Java)

```java
// ✅ Giải thích logic bằng tiếng Việt
// Kiểm tra xem user có đang trong trạng thái bị khóa tài khoản không
// Nếu số lần đăng nhập sai vượt quá 5 lần trong 15 phút thì lock tạm thời
if (failedLoginAttempts >= MAX_ATTEMPTS) {
    throw new AccountLockedException("Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần");
}

// ✅ TODO và FIXME bằng tiếng Việt
// TODO: Thêm validation cho định dạng số điện thoại Việt Nam (+84)
// FIXME: Xử lý edge case khi user upload ảnh > 10MB

// ✅ Javadoc bằng tiếng Việt
/**
 * Tạo JWT access token cho user đã xác thực.
 * Token có hiệu lực trong 15 phút, sau đó cần dùng refresh token.
 *
 * @param userDetails thông tin user từ Spring Security
 * @return JWT token dạng chuỗi Base64 URL-encoded
 */
public String generateAccessToken(UserDetails userDetails) { ... }
```

### 3.2 Frontend (TypeScript/React)

```typescript
// ✅ Comment logic bằng tiếng Việt
// Debounce 500ms để tránh gọi API mỗi lần user gõ
const debouncedSearch = useDebouncedCallback(handleSearch, 500);

// ✅ JSDoc bằng tiếng Việt
/**
 * Hook lấy danh sách listing theo bộ lọc.
 * Tự động refetch khi filter thay đổi.
 *
 * @param filters - Bộ lọc tìm kiếm (giá, diện tích, vị trí...)
 * @returns listings, trạng thái loading, và hàm refresh
 */
export function useListings(filters: ListingFilters) { ... }
```

---

## 4. Quy Tắc Commit Message

### Format Chuẩn

```
<type>(<scope>): <mô tả ngắn bằng tiếng Anh>

[Body tùy chọn - mô tả chi tiết, có thể bằng tiếng Việt]

[Footer tùy chọn - references, breaking changes]
```

### Các loại commit (type)

| Type | Ý nghĩa | Ví dụ |
|---|---|---|
| `feat` | Tính năng mới | `feat(listing): add nearby search with PostGIS` |
| `fix` | Sửa bug | `fix(auth): resolve JWT token refresh race condition` |
| `chore` | Maintenance, không ảnh hưởng logic | `chore(deps): update Spring Boot to 3.3.5` |
| `docs` | Cập nhật tài liệu | `docs(readme): add Docker setup instructions` |
| `refactor` | Tái cấu trúc code | `refactor(service): extract email sending to EmailService` |
| `test` | Thêm/sửa test | `test(auth): add integration test for login flow` |
| `style` | Format, spacing (không đổi logic) | `style(controller): apply google java format` |
| `ci` | CI/CD config | `ci(workflow): add Trivy security scanner` |
| `perf` | Cải thiện hiệu năng | `perf(query): add index on listings.status column` |

### Scope phổ biến

`auth` · `listing` · `kyc` · `user` · `chat` · `email` · `storage` · `config` · `security` · `db` · `ui` · `deps` · `docker`

---

## 5. Quy Tắc AI Agent

Khi Gemini AI trả lời:

1. **Luôn dùng tiếng Việt** để giải thích, tóm tắt, và đặt câu hỏi làm rõ.
2. **Code và tên kỹ thuật** giữ nguyên tiếng Anh trong câu trả lời.
3. **Comment trong code** được tạo ra phải bằng tiếng Việt.
4. **Error message** trong code phải bằng tiếng Việt (vì user cuối là người Việt).
5. **Commit message** được đề xuất phải bằng tiếng Anh (Conventional Commits).
