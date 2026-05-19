## 📋 Mô Tả Thay Đổi

<!-- Giải thích ngắn gọn bạn đã làm gì và tại sao -->



---

## 🏷️ Loại Thay Đổi

<!-- Đánh dấu X vào ô phù hợp -->

- [ ] `feat` — Tính năng mới
- [ ] `fix` — Sửa bug
- [ ] `refactor` — Tái cấu trúc code (không thay đổi chức năng)
- [ ] `chore` — Maintenance, cập nhật dependency
- [ ] `docs` — Cập nhật tài liệu
- [ ] `ci` — Thay đổi CI/CD pipeline
- [ ] `perf` — Cải thiện hiệu năng

---

## 🔗 Liên Kết

- **Issue/Task:** <!-- Closes #123 hoặc N/A -->
- **Related PR:** <!-- PR liên quan (nếu có) -->

---

## 🧪 Cách Test

<!-- Mô tả cách verify thay đổi này hoạt động đúng -->

```
1. 
2. 
3. 
```

**Kết quả mong đợi:**


---

## 📸 Screenshot (nếu có UI thay đổi)

<!-- Kéo thả ảnh vào đây -->

---

## ✅ Self-Review Checklist

<!-- Bắt buộc hoàn thành trước khi request review -->

### Chung
- [ ] Đã đọc lại toàn bộ code diff của mình
- [ ] Không có `console.log`, `System.out.println` debug còn sót lại
- [ ] Không có secret, password, API key trong code
- [ ] Commit messages đúng Conventional Commits format

### Backend (nếu có thay đổi)
- [ ] Business logic nằm ở Service layer, không ở Controller
- [ ] Response được wrap trong `ApiResponse<T>`
- [ ] Input được validate bằng `@Valid` ở Controller
- [ ] Endpoint mới có đúng `@PreAuthorize` annotation
- [ ] Tạo Flyway migration nếu có schema change
- [ ] Unit test cho logic mới (hoặc giải thích lý do không test)

### Frontend (nếu có thay đổi)
- [ ] TypeScript type check pass (`npx tsc --noEmit`)
- [ ] ESLint pass (`npm run lint`)
- [ ] Responsive trên mobile (375px) và desktop (1280px)
- [ ] Loading state và Error state được xử lý
- [ ] Dùng `next/image` thay vì `<img>` tag

### Database
- [ ] Migration file đặt tên đúng: `V{n}__{description}.sql`
- [ ] Migration có `IF NOT EXISTS` / `IF EXISTS` (idempotent)
- [ ] Foreign key columns có INDEX đi kèm
