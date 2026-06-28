# SWT301 — Tài liệu Kiểm thử Phần mềm

> **Môn học:** SWT301 — Software Testing (FPT University)
> **Dự án kiểm thử:** Mạng xã hội thuê trọ trực tuyến
> **Công nghệ dự án:** Spring Boot · Next.js · PostgreSQL · chạy Localhost
> **Chuẩn áp dụng:** ISTQB Foundation Level (CTFL)

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu trúc folder](#cấu-trúc-folder)
- [File tài liệu Excel](#file-tài-liệu-excel)
  - [TestReport.xlsx — Kiểm thử hệ thống](#1-testreportxlsx--kiểm-thử-hệ-thống)
  - [Report5\_UnitTest.xlsx — Kiểm thử đơn vị](#2-report5_unittestxlsx--kiểm-thử-đơn-vị)
- [AI Agent — Sinh test case tự động](#ai-agent--sinh-test-case-tự-động)
- [Quy trình 2 tuần](#quy-trình-2-tuần)
- [Kỹ thuật kiểm thử áp dụng](#kỹ-thuật-kiểm-thử-áp-dụng)

---

## Tổng quan

Folder này chứa toàn bộ tài liệu và công cụ phục vụ môn **SWT301**, bao gồm:

| Thành phần | Mô tả |
|---|---|
| `TestReport.xlsx` | Báo cáo kiểm thử hệ thống (System/Functional & Non-Functional Testing) |
| `Report5_UnitTest.xlsx` | Báo cáo kiểm thử đơn vị (Component/Unit Testing cho backend Java) |
| `agent/` | Ứng dụng AI sinh test case tự động, output khớp format 2 file Excel trên |

---

## Cấu trúc folder

```
SWT/
│
├── README.md                              ← File này — tổng quan toàn bộ folder
│
├── 1737_DN_SE_48_Report5_TestReport.xlsx  ← Báo cáo kiểm thử hệ thống (nộp bài)
├── 1737_DN_SE_48_Report5_UnitTest.xlsx    ← Báo cáo kiểm thử đơn vị (nộp bài)
│
└── agent/                                 ← Công cụ AI hỗ trợ sinh test case
    ├── README.md                          ← Hướng dẫn cài đặt và sử dụng agent
    ├── app.py                             ← Streamlit UI — giao diện chính
    ├── prompts.py                         ← System prompt cho 2 sub-agent AI
    ├── requirements.txt                   ← Python dependencies
    └── .env.example                       ← Template cấu hình API Key
```

---

## File tài liệu Excel

### 1. `TestReport.xlsx` — Kiểm thử hệ thống

Báo cáo kết quả kiểm thử chức năng và phi chức năng toàn bộ hệ thống.

#### Cấu trúc sheet

| Sheet | Mục đích |
|---|---|
| **Cover** | Thông tin dự án: tên, mã, phiên bản, lịch sử thay đổi |
| **Test Cases** | Danh sách tổng hợp tất cả test case theo module |
| **Test Statistics** | Bảng thống kê Pass/Fail/Pending/N\A theo từng module — Exit Criteria |
| **Authentication** | TC cho Đăng ký, Đăng nhập, phân vai Chủ trọ/Người thuê/Admin |
| **Room Management** | TC cho đăng bài, chỉnh sửa phòng, upload ảnh |
| **Search & Filter** | TC cho tìm kiếm theo khu vực, khoảng giá, tiện ích |
| **Social Features** | TC cho Comment, Review, Chat trực tiếp |
| **Post Approval** | TC cho Admin duyệt/từ chối bài đăng |
| **Profile Management** | TC cho cập nhật hồ sơ người dùng |
| **Payment Plan** | TC cho xem gói dịch vụ, thanh toán |
| **KYC Verification** | TC cho gửi hồ sơ KYC (CCCD), phê duyệt/từ chối KYC |
| **Rental Contract** | TC cho ký và xem hợp đồng thuê trọ, hỏi AI về hợp đồng |
| **Deposit & Dispute** | TC cho tạo cọc giữ chỗ, giải ngân cọc và tranh chấp đặt cọc |
| **Payout Management** | TC cho liên kết tài khoản ngân hàng, yêu cầu và xử lý rút tiền |

#### Cấu trúc mỗi sheet module

Mỗi sheet module bao gồm 2 phần:

**Phần đầu — Thông tin tổng quan:**
```
Feature         : [Tên tính năng]
Number of TCs   : [Tổng số test case]
Testing Round   : Round 1 | Round 2 | Round 3
Passed / Failed : [Kết quả mỗi round]
```

**Phần chính — Bảng test case (12 cột):**

| Cột | Nội dung |
|---|---|
| Test Case ID | Định dạng `TC_AUTH_001`, `TC_ROOM_001`... |
| Test Case Description | Mô tả ngắn kịch bản kiểm thử |
| Test Case Procedure | Các bước thực hiện (1. ... 2. ... 3. ...) |
| Expected Results | Kết quả mong đợi cụ thể |
| Pre-conditions | Điều kiện tiên quyết |
| Round 1 | Passed / Failed |
| Test date | Ngày thực hiện |
| Tester | Tên người test |
| Round 2 | Passed / Failed |
| Test date | ... |
| Tester | ... |
| Note | Ghi chú |

#### Quy tắc đặt Test Case ID

| Module | Prefix | Ví dụ |
|---|---|---|
| Authentication | `TC_AUTH_` | TC\_AUTH\_001 |
| Room Management | `TC_ROOM_` | TC\_ROOM\_001 |
| Search & Filter | `TC_SRCH_` | TC\_SRCH\_001 |
| Social Features | `TC_SOCL_` | TC\_SOCL\_001 |
| Post Approval | `TC_APPR_` | TC\_APPR\_001 |
| Profile Management | `TC_PROF_` | TC\_PROF\_001 |
| Payment Plan | `TC_PAY_` | TC\_PAY\_001 |
| KYC Verification | `TC_KYC_` | TC\_KYC\_001 |
| Rental Contract | `TC_CONT_` | TC\_CONT\_001 |
| Deposit & Dispute | `TC_DEP_` | TC\_DEP\_001 |
| Payout Management | `TC_PAYOUT_` | TC\_PAYOUT\_001 |

---

### 2. `Report5_UnitTest.xlsx` — Kiểm thử đơn vị

Báo cáo kiểm thử từng hàm/method trong backend Java, tổ chức theo function.

#### Cấu trúc sheet

| Sheet | Mục đích |
|---|---|
| **Guideline** | Hướng dẫn đọc hiểu format tài liệu |
| **Cover** | Thông tin dự án |
| **Functions** | Danh sách toàn bộ class/function cần kiểm thử kèm LOC |
| **Statistics** | Tổng hợp kết quả: Pass/Fail/Untested · số lượng N/A/B mỗi function |
| **VTFP-01 → VTFP-39** | Mỗi sheet = 1 function, chứa ma trận kiểm thử chi tiết |

#### Cấu trúc sheet Functions (danh sách hàm)

| Cột | Nội dung |
|---|---|
| No | Số thứ tự |
| Requirement Name | Tên tính năng nghiệp vụ |
| Class Name | Tên class Java (ví dụ: `AuthController`, `BookingService`) |
| Function Name | Tên đầy đủ: `VTFP-XX_Tên hàm` |
| Function Code | Mã hàm: `VTFP-01`, `VTFP-02`... |
| Sheet Name | Link đến sheet chi tiết |
| Description | Người phụ trách |
| Pre-Condition | Trạng thái hoàn thành |

#### Cấu trúc sheet VTFP-XX (ma trận kiểm thử)

Mỗi sheet là một **ma trận cross-reference**:
- **Hàng** = Conditions (Preconditions + Input values) và Confirmations (Return + Exception + Log)
- **Cột** = UTCID01, UTCID02, UTCID03... (mỗi cột = 1 test case)
- **Ô** = Đánh dấu `O` nếu test case đó sử dụng condition/confirmation tương ứng

```
Metadata (rows 2-7):
  Function Code    | VTFP-01    | Function Name | VTFP-01_Login via Google
  Created By       | [Tên SV]   | Executed By   | [Tên SV]
  Lines of Code    | 30         | Lack of TCs   | -7
  Passed           | 7          | N/A/B         | 2

Ma trận (từ row 9):
                           | UTCID01 | UTCID02 | UTCID03 | ...
  Condition / Precondition |         |         |         |
    → Điều kiện A          |    O    |    O    |         |
    → Điều kiện B          |         |         |    O    |
  Condition / Input        |         |         |         |
    → Giá trị hợp lệ       |    O    |         |         |
    → Null / empty         |         |         |    O    |
  Confirm / Return         |         |         |         |
    → 200 OK               |    O    |         |         |
    → 400 Bad Request      |         |         |    O    |
  Confirm / Exception      |         |         |         |
  Confirm / Log            |         |         |         |
  Result / Type            |    N    |    N    |    A    |
  Result / Passed-Failed   |    P    |    P    |    P    |
  Result / Executed Date   | date    | date    | date    |
```

**Ký hiệu Type:**
- `N` = Normal — input hợp lệ thông thường
- `A` = Abnormal — input lỗi, ngoại lệ, tấn công
- `B` = Boundary — input tại giá trị biên

---

## AI Agent — Sinh test case tự động

Folder `agent/` chứa ứng dụng Streamlit gồm **2 sub-agent AI** (powered by Anthropic Claude):

| Sub-Agent | Input | Output | File đích |
|---|---|---|---|
| **System Test Chief** | Tên tính năng + mô tả | Bảng Markdown 7 cột | TestReport.xlsx |
| **Unit Test Specialist** | Code hàm Java | 3 bảng: EP/BVA + UTCID flat + Statistics | Report5\_UnitTest.xlsx |

> Chi tiết cài đặt và sử dụng: xem [`agent/README.md`](agent/README.md)

---

## Quy trình 2 tuần

### Tuần 1 — Sinh System Test Cases

```
1. Chạy agent → Tab "Sinh System Test"
2. Nhập từng tính năng (Authentication, Room Management...)
3. Copy bảng output → paste vào sheet tương ứng trong TestReport.xlsx
4. Điền thủ công: Tester, Test date, Round 1 Pass/Fail
5. Cập nhật sheet Test Statistics (tổng hợp Pass/Fail)
```

### Tuần 2 — Sinh Unit Test Cases

```
1. Chạy agent → Tab "Sinh Unit Test"
2. Paste từng hàm Java backend cần test
3. Copy 3 bảng output → điền vào sheet VTFP-XX trong Report5_UnitTest.xlsx
   - Bảng EP/BVA → ghi chú đầu sheet
   - Bảng UTCID flat → transpose thành ma trận cross-reference
   - Bảng Statistics → cập nhật sheet Statistics
4. Chạy test thực tế trên Localhost → cập nhật Passed/Failed + Executed Date
```

### Lưu ý bắt buộc

> **Không copy-paste 100% output AI.** Đọc lại từng test case, điều chỉnh cho đúng
> với logic thực tế của dự án trước khi nộp — theo quy định sử dụng AI của giảng viên SWT301.

---

## Kỹ thuật kiểm thử áp dụng

### Equivalence Partitioning (EP) — Phân vùng tương đương

Chia tập đầu vào thành các vùng có hành vi tương đương:

| Trường | Valid Partition | Invalid Partition |
|---|---|---|
| Giá phòng (VND) | 500,000 – 50,000,000 | < 500,000 hoặc > 50,000,000 |
| Diện tích (m²) | 10 – 200 | < 10 hoặc > 200 |
| Username | 6–50 ký tự, a-z/0-9/_ | Dưới 6, trên 50, ký tự đặc biệt |
| Password | 8–32 ký tự | Dưới 8, trên 32 |

### Boundary Value Analysis (BVA) — Phân tích giá trị biên

Test tại điểm biên và sát ngoài biên (2-point boundary):

| Trường | Below min (A) | At min (N/B) | At max (N/B) | Above max (A) |
|---|---|---|---|---|
| Giá phòng | 499,999 | 500,000 | 50,000,000 | 50,000,001 |
| Diện tích | 9 | 10 | 200 | 201 |
| Username | 5 ký tự | 6 ký tự | 50 ký tự | 51 ký tự |

### Decision Table — Bảng quyết định

Áp dụng cho logic phân quyền và duyệt bài:

| Vai trò | Bài đã duyệt | Kết quả |
|---|---|---|
| Admin | — | Có quyền duyệt/từ chối |
| Chủ trọ | Chưa duyệt | Bài chờ duyệt, ẩn với người thuê |
| Chủ trọ | Đã duyệt | Bài hiển thị công khai |
| Người thuê | — | Chỉ xem, không đăng bài |

### Non-Functional Testing

| Loại | Test case điển hình |
|---|---|
| **Security — SQL Injection** | `' OR 1=1--` trong form đăng nhập, tìm kiếm |
| **Security — XSS** | `<script>alert('xss')</script>` trong tiêu đề bài đăng, comment |
| **Usability** | Thông báo lỗi rõ ràng khi nhập sai; form tự giữ dữ liệu khi lỗi |
