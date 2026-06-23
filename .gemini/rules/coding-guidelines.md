---
trigger: always_on
---

# 📏 Coding Guidelines — RentSpace

> Quy chuẩn viết code áp dụng cho toàn bộ dự án. AI Agent PHẢI tuân thủ 100%.

---

## 1. Nguyên Tắc Chung (Universal Principles)

- **Clean Code First:** Code phải tự giải thích được. Tên biến/hàm phải nói lên mục đích.
- **SOLID:** Áp dụng nghiêm túc, đặc biệt Single Responsibility và Dependency Inversion.
- **DRY (Don't Repeat Yourself):** Extract logic lặp lại thành utility/helper.
- **YAGNI:** Chỉ viết code cho chức năng hiện tại cần. Không over-engineer.
- **Fail Fast:** Validate sớm, throw exception rõ ràng thay vì để lỗi âm thầm.

---

## 2. Quy Chuẩn Backend (Java / Spring Boot)

### 2.1 Đặt Tên (Naming Conventions)

```java
// ✅ Đúng
public class ListingService { }                    // Class: PascalCase
public class UserRepository { }
public ListingResponseDTO getListing(Long id) { } // Method: camelCase, verb + noun
private String jwtSecret;                          // Field: camelCase
public static final String API_BASE_URL = "...";  // Constant: SCREAMING_SNAKE_CASE
```

### 2.2 Cấu Trúc Controller

```java
// ✅ Chuẩn — Controller chỉ làm 3 việc: nhận request, gọi service, trả response
@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
@Tag(name = "Listing API")
public class ListingController {

    private final ListingService listingService;

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin listing theo ID")
    public ResponseEntity<ApiResponse<ListingResponseDTO>> getListing(
            @PathVariable Long id) {
        // Không có business logic ở đây!
        return ResponseEntity.ok(ApiResponse.success(listingService.getListingById(id)));
    }
}

// ❌ Sai — Business logic trong Controller
@GetMapping("/{id}")
public ResponseEntity<?> getListing(@PathVariable Long id) {
    Listing listing = listingRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Not found")); // Logic này phải ở Service!
    return ResponseEntity.ok(listing); // Trả Entity trực tiếp — vi phạm encapsulation!
}
```

### 2.3 Cấu Trúc Service

```java
// ✅ Chuẩn
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // Default read-only cho toàn Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingMapper listingMapper;

    public ListingResponseDTO getListingById(Long id) {
        return listingRepository.findById(id)
            .map(listingMapper::toResponseDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Listing", id));
    }

    @Transactional // Override để bật write transaction cho method này
    public ListingResponseDTO createListing(CreateListingRequest request, String ownerEmail) {
        // Business logic, validation, mapping...
    }
}
```

### 2.4 Exception Handling

```java
// ✅ Dùng custom exceptions, KHÔNG dùng RuntimeException trực tiếp
throw new ResourceNotFoundException("Listing", id);
throw new BusinessException("Chủ nhà chưa hoàn thành KYC");
throw new UnauthorizedException("Bạn không có quyền thực hiện hành động này");

// ✅ GlobalExceptionHandler xử lý tập trung
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }
}
```

### 2.5 Security & Authorization

```java
// ✅ Luôn dùng @PreAuthorize để kiểm tra quyền
@PreAuthorize("hasRole('LANDLORD') and @securityService.isOwner(#id, authentication)")
@DeleteMapping("/{id}")
public ResponseEntity<ApiResponse<Void>> deleteListing(@PathVariable Long id) { ... }

// ✅ Lấy user hiện tại từ SecurityContext
@GetMapping("/me")
public ResponseEntity<ApiResponse<UserDTO>> getProfile(
        @AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(ApiResponse.success(userService.getProfile(userDetails.getUsername())));
}
```

### 2.6 JPA & Database

```java
// ✅ Luôn dùng interface-based projection hoặc @Query để tránh N+1
@Query("SELECT new com.rentspace.dto.ListingSummaryDTO(l.id, l.title, l.price) FROM Listing l WHERE l.owner.id = :ownerId")
List<ListingSummaryDTO> findSummariesByOwnerId(@Param("ownerId") Long ownerId);

// ✅ Dùng Pageable cho danh sách
Page<Listing> findByStatus(ListingStatus status, Pageable pageable);

// ✅ Geo query với PostGIS
@Query(value = "SELECT * FROM listings WHERE ST_DWithin(location, ST_MakePoint(:lon, :lat)::geography, :radiusMeters)", nativeQuery = true)
List<Listing> findNearby(@Param("lon") double lon, @Param("lat") double lat, @Param("radiusMeters") double radiusMeters);

// ❌ Tránh — Fetch toàn bộ entity rồi filter trong Java
List<Listing> all = listingRepository.findAll(); // Nguy hiểm với data lớn!
```

### 2.7 DTO Mapping với MapStruct

```java
// ✅ Luôn dùng MapStruct, KHÔNG map thủ công
@Mapper(componentModel = "spring")
public interface ListingMapper {
    ListingResponseDTO toResponseDTO(Listing listing);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Listing toEntity(CreateListingRequest request);
}

// ❌ Tránh — Map thủ công
ListingResponseDTO dto = new ListingResponseDTO();
dto.setId(listing.getId());
dto.setTitle(listing.getTitle()); // Lỗi thường gặp: quên map field
```

### 2.8 Anti-Patterns Phổ Biến Cần Tránh

| Anti-pattern | Vấn đề | Giải pháp |
|---|---|---|
| `findAll()` không filter | Out of Memory với data lớn | Dùng `Pageable` |
| `@Transactional` ở Controller | Transaction scope quá rộng | Chỉ dùng ở Service |
| Trả `Entity` trực tiếp | Expose internal structure | Luôn dùng DTO |
| `Optional.get()` không kiểm tra | `NoSuchElementException` | Dùng `orElseThrow()` |
| Password/secret trong code | Security vulnerability | Dùng `application.yml` + env vars |
| Catch Exception chung | Che giấu lỗi | Catch exception cụ thể |
| Dùng `@DataJpaTest` mặc định | Lỗi thiếu embedded DB (H2) | Thêm `@AutoConfigureTestDatabase(replace = NONE)` |
| Import class `User` gây xung đột | Lỗi biên dịch (Ambiguity) | Luôn dùng FQN cho `domain.user.User` trong Test |

---

## 3. Quy Chuẩn Frontend (Next.js / TypeScript / React)

### 3.1 Cấu Trúc Component

```typescript
// ✅ Chuẩn — Functional component với TypeScript
interface ListingCardProps {
  listing: ListingDTO;
  onFavorite?: (id: number) => void;
  className?: string;
}

export function ListingCard({ listing, onFavorite, className }: ListingCardProps) {
  // 1. Hooks (luôn ở đầu)
  const { data: user } = useCurrentUser();
  const [isFavorited, setIsFavorited] = useState(false);

  // 2. Derived state / computed values
  const formattedPrice = formatCurrency(listing.price);

  // 3. Event handlers
  const handleFavorite = useCallback(() => {
    onFavorite?.(listing.id);
    setIsFavorited(prev => !prev);
  }, [listing.id, onFavorite]);

  // 4. Render
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      {/* ... */}
    </div>
  );
}
```

### 3.2 Data Fetching với React Query

```typescript
// ✅ Chuẩn — Custom hook wrapping React Query
export function useListing(id: number) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingApi.getById(id),
    staleTime: 5 * 60 * 1000, // 5 phút
    enabled: !!id,
  });
}

// ✅ Mutation với optimistic update
export function useFavoriteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: listingApi.favorite,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
}
```

### 3.3 State Management với Zustand

```typescript
// ✅ Chuẩn — Zustand store với TypeScript
interface AuthStore {
  user: UserDTO | null;
  setUser: (user: UserDTO | null) => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

// ✅ Chỉ dùng Zustand cho client-side state thực sự toàn cục
// ❌ Không dùng Zustand thay thế React Query cho server state
```

### 3.4 Form với React Hook Form + Zod

```typescript
// ✅ Chuẩn — Định nghĩa schema validation trước
const createListingSchema = z.object({
  title: z.string().min(10, "Tiêu đề phải ít nhất 10 ký tự"),
  price: z.number().positive("Giá phải lớn hơn 0"),
  address: z.string().min(5, "Địa chỉ không hợp lệ"),
});

type CreateListingFormData = z.infer<typeof createListingSchema>;

export function CreateListingForm() {
  const form = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: { title: "", price: 0, address: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    // data đã được validate và type-safe
  });
}
```

### 3.5 API Client (Axios)

```typescript
// ✅ Chuẩn — Dùng instance đã cấu hình, KHÔNG dùng axios trực tiếp
import { apiClient } from '@/lib/api'; // Instance với interceptors JWT

export const listingApi = {
  getById: (id: number) =>
    apiClient.get<ApiResponse<ListingDTO>>(`/listings/${id}`).then(r => r.data.data),

  create: (data: CreateListingRequest) =>
    apiClient.post<ApiResponse<ListingDTO>>('/listings', data).then(r => r.data.data),
};
```

### 3.6 Anti-Patterns Frontend Cần Tránh

| Anti-pattern | Vấn đề | Giải pháp |
|---|---|---|
| `fetch` trực tiếp trong component | Không có caching, error handling | Dùng React Query |
| `useEffect` để fetch data | Race condition, memory leak | Dùng React Query |
| Prop drilling sâu > 3 cấp | Code khó maintain | Dùng Zustand hoặc Context |
| `any` type | Mất type safety | Định nghĩa interface/type rõ ràng |
| Hard-code URL API | Khó deploy | Dùng `NEXT_PUBLIC_API_URL` env var |
| `console.log` trong production | Leak thông tin | Dùng logger utility hoặc xóa |

---

## 4. Quy Chuẩn Git & Commit

### 4.1 Conventional Commits

```bash
# Format: <type>(<scope>): <subject>
feat(auth): thêm tính năng đăng nhập bằng Google OAuth
fix(listing): sửa lỗi tìm kiếm theo khoảng cách không trả kết quả
chore(deps): cập nhật Spring Boot lên 3.3.5
docs(api): bổ sung Swagger annotation cho ListingController
refactor(service): tách ListingService thành các service nhỏ hơn
test(auth): thêm unit test cho JwtService
ci(workflow): cập nhật GitHub Actions pipeline thêm security scan
```

### 4.2 Branch Naming

```bash
feature/<ten-tinh-nang>     # feature/listing-search
fix/<mo-ta-bug>             # fix/jwt-token-expiry
chore/<task>                # chore/update-dependencies
hotfix/<mo-ta>              # hotfix/critical-auth-bypass
```

---

## 5. Chuẩn Comment & Javadoc

```java
// ✅ Comment giải thích "TẠI SAO" không phải "CÁI GÌ"
// Dùng native query vì Hibernate Spatial chưa hỗ trợ ST_DWithin qua JPQL
@Query(value = "SELECT * FROM listings WHERE ST_DWithin(...)", nativeQuery = true)

// ✅ Javadoc cho public API
/**
 * Tìm kiếm listing trong bán kính cho trước.
 *
 * @param lat vĩ độ điểm trung tâm (WGS84)
 * @param lon kinh độ điểm trung tâm (WGS84)
 * @param radiusKm bán kính tìm kiếm (km), tối đa 50km
 * @return danh sách listing sắp xếp theo khoảng cách tăng dần
 */
public List<ListingDTO> searchNearby(double lat, double lon, double radiusKm) { ... }
```

---

## 6. Quy Tắc Viết Code Đầy Đủ (Full Output Enforcement)

Khi triển khai các phần code quan trọng, đặc biệt là theo yêu cầu của người dùng, **CẤM CẮT XÉN CODE** hoặc sử dụng các placeholder để viết ngắn lại. 

### Các patterns bị cấm tuyệt đối:
- Dùng `// ...`, `// rest of code`, `// implement ở đây`, `// TODO` để bỏ qua các đoạn code trong file.
- Viết `// tương tự như trên`, `// lặp lại pattern` hoặc thay logic lặp bằng chú thích ngắn gọn.
- Ghi câu văn như: "tôi cung cấp khung xương, bạn tự điền logic", "phần còn lại tương tự".

### Quy trình thực hiện:
1. **Lên danh sách đầy đủ** các deliverables (file, function, tests, class).
2. **Triển khai hoàn chỉnh** từng file/phần từ đầu đến cuối, không viết bản phác thảo hay cắt xén.
3. Nếu response quá dài và có nguy cơ chạm giới hạn token của model:
   - Dừng lại tại một vị trí tự nhiên (hết class, hết hàm, hết file).
   - In thông báo: `[TẠM DỪNG — X/Y hoàn thành. Gửi "tiếp tục" để tiếp tục từ: <tên phần tiếp theo>]`
   - Đợi người dùng gửi "tiếp tục" rồi viết tiếp chính xác từ điểm đã dừng.
