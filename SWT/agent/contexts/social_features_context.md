# Code Context — Module: Social Features
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === ReviewRequest ===
@NotNull(message = "Điểm đánh giá không được để trống")
@Min(value = 1, message = "Điểm đánh giá tối thiểu là 1 sao")
@Max(value = 5, message = "Điểm đánh giá tối đa là 5 sao")
private Integer rating;

@Size(max = 1000, message = "Nội dung bình luận không được vượt quá 1000 ký tự")
private String comment;

@Min(value = 1, message = "Điểm vệ sinh tối thiểu là 1")
@Max(value = 5, message = "Điểm vệ sinh tối đa là 5")
private Integer cleanlinessRating;

@Min(value = 1, message = "Điểm an ninh tối thiểu là 1")
@Max(value = 5, message = "Điểm an ninh tối đa là 5")
private Integer securityRating;

@Min(value = 1, message = "Điểm thái độ chủ trọ tối thiểu là 1")
@Max(value = 5, message = "Điểm thái độ chủ trọ tối đa là 5")
private Integer landlordRating;

// === PostCreateRequest ===
@NotNull(message = "Loại bài đăng không được để trống")
private PostType type; // Enum: REVIEW, DISCUSS, FIND_ROOMMATE

@NotBlank(message = "Nội dung bài đăng không được để trống")
@Size(max = 5000, message = "Nội dung bài đăng không được vượt quá 5000 ký tự")
private String content;

@Size(max = 5, message = "Không được upload quá 5 ảnh")
private List<String> imageUrls;

private Long relatedListingId;

@Size(max = 100, message = "Tên quận/huyện không được vượt quá 100 ký tự")
private String district;

// === CommentCreateRequest ===
@NotBlank(message = "Nội dung bình luận không được để trống")
@Size(max = 1000, message = "Nội dung bình luận không được vượt quá 1000 ký tự")
private String content;
```

---

## Ô 2 — Controller endpoints

```java
// === Reviews APIs ===
GET /api/v1/listings/{listingId}/reviews
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": Page<ReviewResponse>}

POST /api/v1/listings/{listingId}/reviews
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('TENANT')
  RateLimit: capacity = 3, durationInSeconds = 60
  Request : ReviewRequest (@Valid)
  Response: HTTP 201 CREATED
  Body    : {"success": true, "message": "Đăng đánh giá thành công", "data": ReviewResponse}
  Nếu gửi request quá nhanh (quá 3 req/phút): HTTP 429 Too Many Requests ("Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau.")

PUT /api/v1/reviews/{id}
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasRole('TENANT')
  Request : ReviewRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Cập nhật đánh giá thành công", "data": ReviewResponse}

DELETE /api/v1/reviews/{id}
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  PreAuth : hasAnyRole('TENANT', 'ADMIN')
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Xóa đánh giá thành công"}

// === Community Feed APIs ===
POST /api/v1/posts
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : PostCreateRequest (@Valid)
  Response: HTTP 201 CREATED
  Body    : {"success": true, "message": "Đăng bài viết thành công", "data": PostResponse}

GET /api/v1/posts
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Tải danh sách bài đăng thành công", "data": Page<PostResponse>}

POST /api/v1/posts/{id}/like
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Đã thích bài viết" / "Đã bỏ thích bài viết", "data": boolean}

POST /api/v1/posts/{id}/comments
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : CommentCreateRequest (@Valid)
  Response: HTTP 201 CREATED
  Body    : {"success": true, "message": "Bình luận thành công", "data": CommentResponse}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation messages
"Điểm đánh giá không được để trống"
"Điểm đánh giá tối thiểu là 1 sao"
"Điểm đánh giá tối đa là 5 sao"
"Nội dung bình luận không được vượt quá 1000 ký tự"
"Loại bài đăng không được để trống"
"Nội dung bài đăng không được để trống"
"Nội dung bài đăng không được vượt quá 5000 ký tự"
"Không được upload quá 5 ảnh"
"Tên quận/huyện không được vượt quá 100 ký tự"
"Nội dung bình luận không được để trống"

// Exception Handler responses
"Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau."
"Bạn không có quyền thực hiện hành động này"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| rating | `@Min(1) @Max(5)` | 0 → Fail | 1 → Pass | 5 → Pass | 6 → Fail |
| cleanlinessRating | `@Min(1) @Max(5)` | 0 → Fail | 1 → Pass | 5 → Pass | 6 → Fail |
| securityRating | `@Min(1) @Max(5)` | 0 → Fail | 1 → Pass | 5 → Pass | 6 → Fail |
| landlordRating | `@Min(1) @Max(5)` | 0 → Fail | 1 → Pass | 5 → Pass | 6 → Fail |
| comment (Review) | `@Size(max=1000)` | N/A | N/A | 1000 ký tự → Pass | 1001 ký tự → Fail |
| content (Post) | `@Size(max=5000)` | N/A | N/A | 5000 ký tự → Pass | 5001 ký tự → Fail |
| imageUrls (Post) | `@Size(max=5)` | N/A | N/A | 5 ảnh → Pass | 6 ảnh → Fail |
| district (Post) | `@Size(max=100)` | N/A | N/A | 100 ký tự → Pass | 101 ký tự → Fail |
| content (Comment) | `@Size(max=1000)` | N/A | N/A | 1000 ký tự → Pass | 1001 ký tự → Fail |
