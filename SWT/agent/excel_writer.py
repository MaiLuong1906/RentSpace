"""
excel_writer.py — Ghi test case từ Markdown output của AI thẳng vào Excel.
Hỗ trợ:
  - TestReport.xlsx  (Tab 1 — System Test)
  - UnitTest.xlsx    (Tab 2 — Unit Test, chưa triển khai, thêm sau)
"""

from __future__ import annotations
import re
from pathlib import Path
from typing import Optional

import openpyxl
from openpyxl.styles import Alignment, Border, Side, PatternFill, Font


# ─────────────────────────────────────────────────────────────────
# Mapping module → TC prefix (dùng cho auto-renumber nếu cần)
# ─────────────────────────────────────────────────────────────────
MODULE_PREFIX = {
    "Authentication":      "TC_AUTH",
    "Room Management":     "TC_ROOM",
    "Search & Filter":     "TC_SRCH",
    "Social Features":     "TC_SOCL",
    "Post Approval":       "TC_APPR",
    "Profile Management":  "TC_PROF",
    "Payment Plan":        "TC_PAY",
    "KYC Verification":    "TC_KYC",
    "Rental Contract":     "TC_CONT",
    "Deposit & Dispute":   "TC_DEP",
    "Payout Management":   "TC_PAYOUT",
}

# Tiêu đề cột trong Excel (Row 10 của mỗi sheet module)
# Thứ tự: A B C D E F G H I J K L M N
EXCEL_HEADER = [
    "Test Case ID",          # A
    "Test Case Description", # B
    "Test Case Procedure",   # C
    "Test Data",             # D
    "Expected Results",      # E
    "Pre-conditions",        # F
    "Round 1",               # G
    "Test date",             # H
    "Tester",                # I
    "Round 2",               # J
    "Test date",             # K
    "Tester",                # L
    "Round 3",               # M
    "Test date",             # N
]

# Mapping tên cột Markdown → index trong EXCEL_HEADER (0-based)
# Markdown có 7 cột: ID, Description, Pre-conditions, Procedure, Test Data, Expected Results, Severity
MARKDOWN_TO_EXCEL = {
    "test case id":          0,   # → A (col 1)
    "test case description": 1,   # → B (col 2)
    "test case procedure":   2,   # → C (col 3)
    "test data":             3,   # → D (col 4)
    "expected results":      4,   # → E (col 5)
    "pre-conditions":        5,   # → F (col 6)
    "pre-condition":         5,
    "preconditions":         5,
    "precondition":          5,
    "severity":              None, # bỏ qua
}


def _thin_border():
    thin = Side(style="thin", color="000000")
    return Border(left=thin, right=thin, top=thin, bottom=thin)


def _wrap_alignment():
    return Alignment(wrap_text=True, vertical="top", horizontal="left")


def _header_fill():
    return PatternFill(fill_type="solid", start_color="4F81BD", end_color="4F81BD")


def _header_font():
    return Font(bold=True, color="FFFFFF", size=10, name="Tahoma")


def _data_font():
    return Font(size=10, name="Tahoma")


def _clean(text: str) -> str:
    """Xử lý chuỗi Markdown nhẹ: bỏ ** và ` inline."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)  # bold
    text = re.sub(r"`(.+?)`", r"\1", text)         # inline code
    text = text.replace("<br>", "\n").replace("<br/>", "\n")
    return text.strip()


# ─────────────────────────────────────────────────────────────────
# PARSE MARKDOWN TABLE → list[dict]
# ─────────────────────────────────────────────────────────────────

def parse_markdown_table(markdown_text: str) -> tuple[list[str], list[dict]]:
    """
    Tìm bảng Markdown đầu tiên trong output AI có cột "Test Case ID"
    và trả về (headers, rows).
    """
    lines = markdown_text.splitlines()

    # Tìm dòng header chứa "Test Case ID" (case-insensitive)
    header_idx = None
    for i, line in enumerate(lines):
        if re.search(r"test case id", line, re.IGNORECASE) and "|" in line:
            header_idx = i
            break

    if header_idx is None:
        return [], []

    # Parse header
    raw_headers = [h.strip() for h in lines[header_idx].split("|") if h.strip()]

    # Dòng separator (---)
    sep_idx = header_idx + 1

    # Parse data rows
    rows = []
    for line in lines[sep_idx + 1:]:
        line = line.strip()
        if not line.startswith("|"):
            break  # hết bảng
        cells = [_clean(c) for c in line.split("|") if c != ""]
        if len(cells) < 2:
            continue
        row = {}
        for j, h in enumerate(raw_headers):
            row[h] = cells[j] if j < len(cells) else ""
        rows.append(row)

    return raw_headers, rows


# ─────────────────────────────────────────────────────────────────
# GHI VÀO TESTREPOR.xlsx
# ─────────────────────────────────────────────────────────────────

def write_to_test_report(
    xlsx_path: str | Path,
    module: str,
    headers: list[str],
    rows: list[dict],
    start_row: int = 11,
    overwrite: bool = False,
) -> tuple[bool, str]:
    """
    Ghi test cases vào sheet <module> trong TestReport.xlsx.

    Args:
        xlsx_path:  Đường dẫn tới file TestReport.xlsx
        module:     Tên module (trùng với tên sheet)
        headers:    Tiêu đề cột từ markdown (raw strings)
        rows:       Danh sách dict (header → value)
        start_row:  Hàng bắt đầu ghi dữ liệu (mặc định = 11)
        overwrite:  Nếu True → xóa toàn bộ dữ liệu cũ trong sheet trước khi ghi

    Returns:
        (success: bool, message: str)
    """
    xlsx_path = Path(xlsx_path)
    if not xlsx_path.exists():
        return False, f"❌ Không tìm thấy file: {xlsx_path}"

    if not rows:
        return False, "❌ Không tìm thấy dữ liệu test case để ghi."

    try:
        wb = openpyxl.load_workbook(str(xlsx_path))
    except Exception as e:
        return False, f"❌ Không mở được file Excel: {e}"

    if module not in wb.sheetnames:
        return False, f"❌ Sheet '{module}' không tồn tại trong file Excel. Hãy tạo sheet trước."

    ws = wb[module]

    # Kiểm tra dữ liệu cũ
    existing_count = sum(
        1 for r in range(start_row, ws.max_row + 1)
        if ws.cell(r, 1).value
    )

    if existing_count > 0 and not overwrite:
        return False, (
            f"⚠️ Sheet '{module}' đã có **{existing_count} test case** từ dòng {start_row}. "
            f"Chọn **Overwrite** để ghi đè hoặc **Append** để tiếp tục từ dòng tiếp theo."
        )

    # Nếu overwrite, xóa dữ liệu cũ từ start_row trở xuống
    if overwrite and existing_count > 0:
        for r in range(start_row, ws.max_row + 1):
            for c in range(1, 15):
                ws.cell(r, c).value = None

    # Tìm dòng ghi tiếp theo
    actual_start = start_row
    if not overwrite:
        for r in range(start_row, start_row + 2000):
            if not ws.cell(r, 1).value:
                actual_start = r
                break

    # Chuẩn bị map header markdown → index excel (0-based)
    # header raw như: "Test Case ID", "Test Case Description", v.v.
    header_map: dict[str, int] = {}
    for h in headers:
        key = h.lower().strip()
        if key in MARKDOWN_TO_EXCEL and MARKDOWN_TO_EXCEL[key] is not None:
            header_map[h] = MARKDOWN_TO_EXCEL[key]

    # Cột excel mà chúng ta sẽ điền: A(1)..E(5) = 5 cột chính
    written = 0
    for row_data in rows:
        # Khởi tạo 14 cột với giá trị trống
        excel_row: list[str] = [""] * 14

        for md_header, val in row_data.items():
            key = md_header.lower().strip()
            excel_col = MARKDOWN_TO_EXCEL.get(key)
            if excel_col is not None:
                excel_row[excel_col] = val

        # Ghi vào sheet
        current_row = actual_start + written
        for col_idx, cell_val in enumerate(excel_row[:6], start=1):
            cell = ws.cell(current_row, col_idx)
            cell.value = cell_val if cell_val else None
            cell.alignment = _wrap_alignment()
            cell.border = _thin_border()
            cell.font = _data_font()

        # Các cột còn lại G-N (Round 1 / 2 / 3, Tester, Date) để trống có border
        for col_idx in range(7, 15):
            cell = ws.cell(current_row, col_idx)
            cell.value = None
            cell.alignment = _wrap_alignment()
            cell.border = _thin_border()
            cell.font = _data_font()

        # Điều chỉnh chiều cao hàng
        max_lines = max(
            len(str(v).split("\n")) for v in excel_row[:6] if v
        ) if any(excel_row[:6]) else 1
        ws.row_dimensions[current_row].height = max(15, min(max_lines * 15, 120))

        written += 1

    # Cập nhật Number of TCs (Row 4 Col B)
    ws["B4"] = written + (existing_count if not overwrite else 0)

    try:
        wb.save(str(xlsx_path))
        return True, f"✅ Đã ghi **{written} test cases** vào sheet **'{module}'** (dòng {actual_start}–{actual_start + written - 1})."
    except PermissionError:
        return False, "❌ Không lưu được file — Excel đang mở. Hãy đóng TestReport.xlsx rồi thử lại."
    except Exception as e:
        return False, f"❌ Lỗi khi lưu file: {e}"
