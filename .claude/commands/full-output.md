---
name: full-output
description: Ghi đè hành vi cắt ngắn code. Dùng khi implement service class, component lớn, migration SQL, hoặc bất kỳ file nào yêu cầu output đầy đủ không bị rút gọn.
---

# Full Output Enforcement

Kích hoạt khi người dùng yêu cầu implement đầy đủ — service, controller, component, migration, test.

## Nguyên tắc

Output không đầy đủ = output bị lỗi. Không tối ưu cho ngắn gọn — tối ưu cho hoàn chỉnh.

## Pattern bị cấm tuyệt đối

**Trong code block:**
- `// ...`, `// rest of code`, `// implement here`, `// TODO`, `/* ... */`
- `// similar to above`, `// continue pattern`, `// add more as needed`
- Dấu `...` thay thế cho code bị bỏ qua

**Trong văn xuôi:**
- "tôi có thể cung cấp thêm nếu cần"
- "phần còn lại tương tự như trên"
- "for brevity", "vì ngắn gọn"
- "bạn có thể tự implement phần này"

**Shortcut cấu trúc:**
- Đưa skeleton khi yêu cầu full implementation
- Chỉ hiện đầu và cuối, bỏ giữa
- Thay logic lặp bằng "tương tự như trên"

## Quy trình

1. **Đếm deliverable** — Đọc toàn yêu cầu. Đếm số file/function/section cần giao.
2. **Viết đầy đủ** — Mỗi deliverable hoàn chỉnh. Không bản nháp.
3. **Kiểm tra chéo** — So sánh output với danh sách ở bước 1.

## Xử lý output dài

Khi response sắp chạm giới hạn token:
- Không nén phần còn lại
- Không nhảy đến kết luận
- Viết đến điểm dừng tự nhiên (cuối method, cuối class, cuối file)
- Kết thúc bằng:

```
[TẠM DỪNG — X/Y hoàn thành. Gửi "tiếp tục" để tiếp tục từ: <tên phần tiếp theo>]
```

Khi nhận "tiếp tục": tiếp tục đúng điểm đã dừng. Không tóm tắt lại.

## Ngữ cảnh RentSpace

Các file thường cần full output:
- Spring Boot service class (50-200 dòng)
- Spring Boot controller với nhiều endpoint
- Next.js page component với data fetching
- Flyway migration SQL (V23–V29)
- Zod schema + React Hook Form component
- Test class (JUnit 5 + Mockito)

Không apply cho: câu trả lời khái niệm, giải thích architecture, debug ngắn.
