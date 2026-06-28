# SWT301 AI Agent — Hướng dẫn cài đặt & sử dụng

> Công cụ sinh test case tự động cho môn SWT301, output khớp format
> `TestReport.xlsx` và `Report5_UnitTest.xlsx`.

---

## Yêu cầu

| Thứ cần có | Phiên bản |
|---|---|
| Python | 3.10 trở lên |
| API Key | Anthropic **hoặc** Groq (xem mục [Chọn model AI](#chọn-model-ai)) |

---

## Cài đặt (1 lần duy nhất)

```bash
# 1. Di chuyển vào folder agent
cd SWT/agent

# 2. Tạo và kích hoạt môi trường ảo (khuyên dùng, tránh xung đột package)
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# 3. Cài dependencies
pip install -r requirements.txt

# 4. Tạo file .env từ template
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux

# 5. Mở .env, điền API Key vào (Anthropic hoặc Groq — xem bên dưới)
# ANTHROPIC_API_KEY=sk-ant-api03-...
# GROQ_API_KEY=gsk_...
```

> **Lưu ý PowerShell:** Nếu bị lỗi "script is not digitally signed" khi activate venv,
> chạy lệnh này một lần: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

## Chạy ứng dụng

```bash
streamlit run app.py
```

Trình duyệt tự mở tại `http://localhost:8501`.
Nếu không tự mở, copy URL từ terminal vào trình duyệt.

---

## Giao diện — 2 Tab chính

### Tab 1: Sinh System Test → `TestReport.xlsx`

**Dùng khi:** Cần sinh test case cho một tính năng hệ thống (Authentication, Room Management...)

**Các bước:**

1. Chọn **Module** tương ứng với sheet trong TestReport.xlsx
2. Nhập **mô tả tính năng** — **quan trọng: ghi rõ range** (ví dụ: "8–32 ký tự", không chỉ "ít nhất 8")
3. Nhập **ràng buộc nghiệp vụ** nếu có (tùy chọn)
4. (Khuyên dùng) Mở expander **Code Context** → paste code từ `contexts/<module>_context.md`
   - Module Authentication: xem `contexts/auth_context.md`
   - Không cần paste nguyên file — copy đúng 3 ô tương ứng
5. Nhấn **"Sinh System Test Cases"**
6. Copy bảng kết quả vào đúng sheet module trong TestReport.xlsx

> **Tại sao cần Code Context?** Nếu không paste code, agent sẽ phỏng đoán HTTP status và
> error message — có thể sai. Ví dụ: Register thực tế trả HTTP 201 (không phải 200), password
> chỉ có `min=8` (không có max=32 như nhiều người nghĩ).

**Ví dụ input tốt:**
```
Module: Room Management

Tính năng: Chủ trọ đăng tin phòng trọ mới
- Tiêu đề: 10–200 ký tự
- Giá thuê: 500,000 – 50,000,000 VND/tháng
- Diện tích: 10 – 200 m²
- Upload ảnh: tối đa 10 ảnh, mỗi ảnh < 5MB, chỉ JPG/PNG
- Admin phải duyệt bài trước khi hiển thị công khai

Ràng buộc: Chỉ tài khoản vai Chủ trọ mới được truy cập form đăng tin.
```

**Output trả về — 7 cột:**

| Test Case ID | Test Case Description | Pre-conditions | Test Case Procedure | Test Data | Expected Results | Severity |
|---|---|---|---|---|---|---|
| TC\_ROOM\_001 | ... | ... | 1. ...<br>2. ... | ... | ... | Major |

---

### Tab 2: Sinh Unit Test → `Report5_UnitTest.xlsx`

**Dùng khi:** Cần sinh unit test case cho một hàm Java backend.

**Các bước:**

1. Nhập **Function Code** (ví dụ: `RSTS-01`) — để trống nếu chưa biết
2. Nhập **Class Name** (ví dụ: `RoomValidationUtil`)
3. Paste **code hàm Java** hoặc mô tả signature + business rules
4. Nhấn **"Sinh Unit Test Cases"**
5. Copy 3 bảng kết quả vào sheet VTFP-XX trong Report5\_UnitTest.xlsx

**Ví dụ input — paste code:**
```java
// Validate giá phòng trọ
public boolean validateRoomPrice(double price) {
    if (price < 500_000 || price > 50_000_000) {
        throw new IllegalArgumentException("Giá phòng phải từ 500,000 đến 50,000,000 VND");
    }
    return true;
}
```

**Ví dụ input — chỉ mô tả (không có code):**
```
Hàm checkUsernameAvailable(String username):
- Username: 6–50 ký tự, chỉ a-z/A-Z/0-9/_
- Truy vấn DB kiểm tra trùng
- Trả về true nếu username chưa tồn tại
- Throw UsernameExistsException nếu đã có
```

**Output trả về — 3 bảng:**

**Bảng 1** — Phân tích EP/BVA (hiểu logic, không cần paste vào Excel):
```
| Kỹ thuật   | Partition / Boundary | Input mẫu | Valid/Invalid |
| EP Valid   | ...                  | 1,000,000 | Valid         |
| BVA Min    | Biên dưới            | 500,000   | Valid (B)     |
| BVA Below  | Biên dưới - 1        | 499,999   | Invalid (A)   |
```

**Bảng 2** — UTCID flat (transpose vào ma trận VTFP-XX):
```
| UTCID   | Type | Precondition | Input Value | Expected Return | Expected Exception | Log |
| UTCID01 | N    | ...          | 1,000,000   | true            | None               | ... |
| UTCID02 | B    | ...          | 500,000     | true            | None               | ... |
| UTCID03 | B    | ...          | 50,000,000  | true            | None               | ... |
| UTCID04 | A    | ...          | 499,999     | —               | IllegalArgument... | ... |
| UTCID05 | A    | ...          | 50,000,001  | —               | IllegalArgument... | ... |
| UTCID06 | A    | ...          | null        | —               | NullPointer...     | ... |
| UTCID07 | A    | ...          | SQL payload | Rejected        | ...                | ... |
```

**Bảng 3** — Tổng hợp cho sheet Statistics:
```
N (Normal)   : 1
A (Abnormal) : 4
B (Boundary) : 2
Total TCs    : 7
```

---

## Cách transpose Bảng 2 vào ma trận Excel VTFP-XX

File UnitTest.xlsx dùng format ma trận cross-reference (khác với flat table agent sinh ra).
Các bước transpose:

```
Bảng flat agent sinh:
  UTCID01 | Precond: DB hoạt động | Input: 1,000,000 | Return: true | Type: N

Trong Excel VTFP-XX, điền như sau:
  Hàng "Precondition → DB hoạt động" → cột UTCID01 → ghi O
  Hàng "Input → 1,000,000 (valid)"   → cột UTCID01 → ghi O
  Hàng "Return → true"               → cột UTCID01 → ghi O
  Hàng "Result / Type"               → cột UTCID01 → ghi N
```

---

## Chọn model AI

Mở sidebar trong app → chọn model:

| Model | Tốc độ | Chi phí | Khi nào dùng |
|---|---|---|---|
| `claude-haiku-4-5` | Rất nhanh | Thấp nhất | Sinh hàng loạt, test nhanh |
| `claude-sonnet-4-6` | Trung bình | Cao hơn | Output chất lượng cao, bài nộp cuối |

---

## Cấu trúc code

```
agent/
├── app.py        ← UI Streamlit: layout, 2 tab, gọi API, streaming output
├── prompts.py    ← System prompt cho Sub-Agent 1 và Sub-Agent 2
├── requirements.txt
├── .env.example
├── .env          ← KHÔNG commit file này (chứa API Key)
└── contexts/     ← Code context mẫu sẵn có, copy-paste vào expander trên UI
    └── auth_context.md   ← Module Authentication (DTO + endpoints + error messages)
```

### `prompts.py` — Hai system prompt

| Hằng số | Dành cho | Kỹ thuật áp dụng |
|---|---|---|
| `SYSTEM_TEST_PROMPT` | Tab 1 — System Test | EP, BVA, Decision Table, Security |
| `UNIT_TEST_PROMPT` | Tab 2 — Unit Test | EP, BVA 2-point, Type N/A/B |

Muốn tinh chỉnh hành vi AI: chỉnh sửa nội dung 2 hằng số này trong `prompts.py`.

### `app.py` — Flow xử lý

```
User input
  → call_claude(system_prompt, user_message)   # streaming response
      → anthropic.messages.stream(...)
          → output hiển thị real-time trên UI
              → lưu vào st.session_state
                  → nút Download (.md / .txt)
```

---

## Lưu ý bảo mật

- File `.env` chứa API Key — **không commit lên Git**
- `.gitignore` nên thêm dòng: `SWT/agent/.env`
- Nếu lỡ commit API Key: revoke ngay tại console.anthropic.com

---

## Câu hỏi thường gặp

**Q: Lỗi "Authentication Error"?**
A: API Key sai hoặc hết hạn. Kiểm tra lại tại console.anthropic.com.

**Q: Output bị cắt giữa chừng?**
A: Tăng **Max tokens** trong sidebar (kéo slider lên 6144 hoặc 8192).

**Q: Muốn sinh nhiều tính năng cùng lúc?**
A: Hiện tại mỗi lần sinh 1 tính năng. Chạy lần lượt từng module rồi tổng hợp.

**Q: Output AI không khớp với logic dự án?**
A: Paste code vào **Code Context expander** (DTO + Controller + ExceptionHandler).
   Xem file mẫu trong `contexts/auth_context.md` — chỉ cần copy-paste, không cần tự viết.

**Q: Expected Results sai HTTP status hoặc error message?**
A: Nguyên nhân: không có Code Context. Paste code thực tế vào expander để agent đọc
   đúng annotations (@Size, @Pattern, message="...") và URLs từ @PostMapping.
