# Code Context — Module: Search & Filter
# Copy từng phần vào đúng ô trong tab "Sinh System Test" của agent

---

## Ô 1 — DTO / Request class

```java
// === GeoSearchRequest ===
private List<CoordinateDTO> polygon; // Danh sách các điểm tọa độ khép kín/hở
private Double radiusKm;
private BigDecimal centerLat;
private BigDecimal centerLng;
private RoomType roomType;
private BigDecimal minPrice;
private BigDecimal maxPrice;
private BigDecimal minArea;

// === CoordinateDTO ===
@NotNull(message = "Vĩ độ (latitude) không được để trống")
private BigDecimal lat;

@NotNull(message = "Kinh độ (longitude) không được để trống")
private BigDecimal lng;
```

---

## Ô 2 — Controller endpoints

```java
// Base URL: /api/v1/listings

GET /api/v1/listings
  Request parameters:
    - city: String (optional)
    - district: String (optional)
    - minPrice: BigDecimal (optional)
    - maxPrice: BigDecimal (optional)
    - minArea: BigDecimal (optional)
    - Pageable params (page, size, sort)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": Page<ListingResponse>}

GET /api/v1/listings/nearby
  Request parameters:
    - lat: double (required)
    - lng: double (required)
    - radius: double (optional, default 5.0)
    - limit: int (optional, default 20, max 50)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": List<ListingResponse>}
  Nếu thiếu lat/lng: HTTP 400 Bad Request

POST /api/v1/listings/search/geo
  Request : GeoSearchRequest (@Valid)
  Response: HTTP 200 OK
  Body    : {"success": true, "message": "Thành công", "data": List<ListingResponse>}
```

---

## Ô 3 — Exception Handler / Error messages

```
// Validation messages
"Vĩ độ (latitude) không được để trống"
"Kinh độ (longitude) không được để trống"
"Vui lòng cung cấp đầy đủ thông tin yêu cầu (thiếu tham số hoặc file)"
```

---

## Lưu ý BVA từ code thực tế

| Field | Constraint thực tế | BVA below_min | BVA at_min (Pass) | at_max | above_max |
|---|---|---|---|---|---|
| lat (CoordinateDTO) | `@DecimalMin("-90.0") @DecimalMax("90.0")` | -90.1 → Fail | -90.0 → Pass | 90.0 → Pass | 90.1 → Fail |
| lng (CoordinateDTO) | `@DecimalMin("-180.0") @DecimalMax("180.0")` | -180.1 → Fail | -180.0 → Pass | 180.0 → Pass | 181.0 → Fail |
| limit (nearby) | Max 50 | N/A | 1 → Pass | 50 → Pass | 51 → Giới hạn về 50 |
