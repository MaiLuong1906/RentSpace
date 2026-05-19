# ⚙️ Workflow — RentSpace Git & Development Process

> Quy trình làm việc chuẩn. AI Agent phải đề xuất đúng branch name, commit message và PR flow theo tài liệu này.

---

## 1. Branching Strategy (Git Flow)

```
main          ← Production. Chỉ nhận code qua PR đã pass CI.
  └── develop ← Integration branch. Merge feature vào đây trước.
        └── feature/<tên>   ← Tính năng mới
        └── fix/<tên>        ← Sửa bug
        └── hotfix/<tên>     ← Sửa lỗi khẩn cấp (từ main)
        └── chore/<tên>      ← Maintenance, refactor, deps update
```

### Quy Tắc Tuyệt Đối

- **KHÔNG** push trực tiếp lên `main` hoặc `develop`
- **LUÔN** tạo branch từ `develop` (trừ `hotfix` tạo từ `main`)
- **LUÔN** tạo PR và cần ít nhất 1 approval trước khi merge
- `main` chỉ nhận merge từ `develop` (release) hoặc `hotfix/*`

---

## 2. Branch Naming Convention

```bash
# Format: <type>/<short-description> (kebab-case, tiếng Anh)

feature/listing-nearby-search
feature/kyc-document-upload
feature/realtime-chat-websocket

fix/jwt-token-refresh-loop
fix/listing-image-upload-fail
fix/postgis-distance-calculation

hotfix/critical-auth-bypass
hotfix/payment-double-charge

chore/update-spring-boot-3.3.5
chore/add-redis-cache-listing
chore/migrate-s3-to-local-storage
```

---

## 3. Commit Message (Conventional Commits)

### Format

```
<type>(<scope>): <subject>

[body — tùy chọn, giải thích ngắn bằng tiếng Việt]

[footer — tùy chọn: Closes #123, BREAKING CHANGE: ...]
```

### Types

| Type | Khi nào dùng |
|---|---|
| `feat` | Tính năng mới |
| `fix` | Sửa bug |
| `chore` | Maintenance, không ảnh hưởng logic |
| `docs` | Cập nhật tài liệu |
| `refactor` | Tái cấu trúc code |
| `test` | Thêm/sửa test |
| `style` | Format, spacing |
| `ci` | CI/CD config |
| `perf` | Cải thiện hiệu năng |
| `revert` | Hoàn tác commit |

### Scopes Phổ Biến

`auth` · `listing` · `kyc` · `user` · `chat` · `email` · `storage` · `config` · `security` · `db` · `ui` · `deps` · `docker`

### Ví Dụ Thực Tế

```bash
feat(listing): add nearby search with PostGIS ST_DWithin
fix(auth): resolve refresh token expiry race condition
chore(deps): upgrade Spring Boot to 3.3.5
ci(workflow): add Trivy security scanner to CI pipeline
docs(api): add Swagger annotations to ListingController
refactor(service): extract image upload logic to StorageService
test(auth): add integration tests for JWT token flow
perf(db): add GIST index on listings.location column
```

---

## 4. Pull Request Process

### Tạo PR

1. Push branch lên remote
2. Tạo PR **vào `develop`** (trừ hotfix → PR vào `main`)
3. Điền đầy đủ PR template
4. Assign reviewer phù hợp theo `CODEOWNERS`
5. Đợi CI pass (`ci.yml` — tất cả checks xanh)
6. Request review

### Review Guidelines

- Reviewer phải chạy **reviewer.md checklist** trước khi approve
- Không approve code có security issue dù nhỏ
- Comment constructive: giải thích tại sao, không chỉ "sai"
- Resolve tất cả conversation trước khi merge

### Merge Strategy

```
feature/* → develop    : Squash merge (gộp commits gọn gàng)
develop   → main       : Merge commit (giữ lịch sử release rõ ràng)
hotfix/*  → main       : Merge commit (sau đó cherry-pick vào develop)
```

---

## 5. Release Flow

```
1. Tạo PR: develop → main
2. Đặt tên PR: "Release v1.x.x — [Mô tả ngắn]"
3. CI pass + 1 approval
4. Merge → main
5. CD pipeline tự động deploy (ci-cd.yml)
6. Tag release: git tag -a v1.x.x -m "Release notes..."
7. Push tag: git push origin v1.x.x
```

---

## 6. Hotfix Flow (Khẩn Cấp)

```bash
# 1. Tạo branch hotfix từ main
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bypass

# 2. Fix bug, commit
git commit -m "hotfix(auth): patch JWT validation bypass vulnerability"

# 3. PR vào main (bypass develop để deploy nhanh)
# 4. Sau khi merge vào main → cherry-pick vào develop
git checkout develop
git cherry-pick <commit-hash>
```

---

## 7. Checklist Trước Khi Tạo PR

```
□ Branch tên đúng convention (feature/, fix/, ...)
□ Commit messages đúng Conventional Commits format
□ Không có file .env, secret, password trong commit
□ mvnw test pass local (backend)
□ npm run build pass local (frontend)
□ Flyway migration file được tạo nếu có schema change
□ PR description điền đầy đủ template
□ Assign đúng reviewer theo CODEOWNERS
```
