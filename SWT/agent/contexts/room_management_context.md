# Code Context — Module: Room Management
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === CreateListingRequest ===
@NotBlank(message = "Tiêu đề không được để trống")
@Size(min = 10, max = 200, message = "Tiêu đề phải từ 10 đến 200 ký tự")
private String title;

@Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
private String description;

@NotBlank(message = "Địa chỉ không được để trống")
private String address;

private String ward;
private String district;
private String city;

@DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
private BigDecimal latitude;

@DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
private BigDecimal longitude;

@NotNull(message = "Giá thuê không được để trống")
@DecimalMin(value = "0.0", inclusive = false, message = "Giá thuê phải lớn hơn 0")
private BigDecimal pricePerMonth;

@DecimalMin(value = "0.0", inclusive = false, message = "Diện tích phải lớn hơn 0")
private BigDecimal areaM2;

@Min(value = 0, message = "Số phòng ngủ phải >= 0")
private Integer numBedrooms;

@Min(value = 0, message = "Số phòng tắm phải >= 0")
private Integer numBathrooms;

private Boolean hasWifi = false;
private Boolean hasParking = false;
private Boolean hasAirConditioner = false;
private Boolean hasWashingMachine = false;
private Boolean allowPets = false;

private RoomType roomType; // Enum: PHONG_TRO, NHA_NGUYEN_CAN, CAN_HO, CHUNG_CU_MINI, O_GHEP

// === UpdateListingStatusRequest ===
@NotNull(message = "Trạng thái không được để trống")
private ListingStatus status; // Enum: PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, DELETED
```

---

## Ô 2 — Controller endpoints

```java
// Base URL: /api/v1/listings

POST /api/v1/listings
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : CreateListingRequest (@Valid)
  Response: HTTP 201 CREATED
  Body    : {"success": true, "message": "Đăng tin thành công", "data": ListingResponse}
  Nếu chưa đăng nhập: HTTP 401 Unauthorized ("Bạn cần đăng nhập để đăng tin")
  Nếu không phải LANDLORD: HTTP 400 Bad Request ("Chỉ tài khoản Chủ trọ (LANDLORD) mới được đăng tin. Vui lòng liên hệ hỗ trợ để nâng cấp tài khoản.")
  Nếu chưa KYC: HTTP 400 Bad Request ("Bạn cần hoàn thành xác thực danh tính (KYC) trước khi đăng tin")

PUT /api/v1/listings/{id}
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : CreateListingRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Cập nhật tin đăng thành công", "data": ListingResponse}
  Nếu không sở hữu tin đăng: HTTP 400 Bad Request ("Không tìm thấy tin đăng hoặc bạn không có quyền sở hữu")

PATCH /api/v1/listings/{id}/status
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : UpdateListingStatusRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Cập nhật trạng thái thành công", "data": ListingResponse}

DELETE /api/v1/listings/{id}
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Xóa tin đăng thành công"}

POST /api/v1/listings/{id}/images
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Request : Multipart file (param name: "image")
  Response: HTTP 201 CREATED
  Body    : {"success": true, "message": "Upload ảnh thành công", "data": ListingImageResponse}
  Nếu vượt quá giới hạn file: HTTP 413 Payload Too Large ("Kích thước file vượt quá giới hạn cho phép")
  Nếu upload quá 10 ảnh: HTTP 400 Bad Request ("Vượt quá số lượng ảnh tối đa cho phép (10 ảnh)")

DELETE /api/v1/listings/{id}/images/{imageId}
  Header  : Authorization: Bearer <accessToken> [BẮT BUỘC]
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Xóa ảnh thành công"}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Lỗi xác thực hoặc validation
"Tiêu đề không được để trống"
"Tiêu đề phải từ 10 đến 200 ký tự"
"Mô tả tối đa 5000 ký tự"
"Địa chỉ không được để trống"
"Giá thuê không được để trống"
"Giá thuê phải lớn hơn 0"
"Diện tích phải lớn hơn 0"
"Kích thước file vượt quá giới hạn cho phép"

// Lỗi nghiệp vụ (BusinessException)
"Chỉ tài khoản Chủ trọ (LANDLORD) mới được đăng tin. Vui lòng liên hệ hỗ trợ để nâng cấp tài khoản."
"Bạn cần hoàn thành xác thực danh tính (KYC) trước khi đăng tin"
"Không tìm thấy tin đăng hoặc bạn không có quyền sở hữu"
"Tin đăng này hiện không công khai"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| title | `@Size(min=10, max=200)` | 9 ký tự → Fail | 10 ký tự → Pass | 200 ký tự → Pass | 201 ký tự → Fail |
| description | `@Size(max=5000)` | N/A | N/A | 5000 ký tự → Pass | 5001 ký tự → Fail |
| pricePerMonth | `@DecimalMin(value="0.0", inclusive=false)` | 0.0 → Fail | 0.01 (hoặc lớn hơn) → Pass | N/A | N/A |
| areaM2 | `@DecimalMin(value="0.0", inclusive=false)` | 0.0 → Fail | 0.01 (hoặc lớn hơn) → Pass | N/A | N/A |
| numBedrooms | `@Min(0)` | -1 → Fail | 0 → Pass | N/A | N/A |
| numBathrooms | `@Min(0)` | -1 → Fail | 0 → Pass | N/A | N/A |
| image | Max 10 ảnh, size < 5MB | N/A | 1 ảnh → Pass | 10 ảnh → Pass | 11 ảnh → Fail |
