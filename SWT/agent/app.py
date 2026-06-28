"""
SWT301 Test Case Generator
Dự án: Mạng xã hội thuê trọ trực tuyến (Spring Boot/Next.js/PostgreSQL)
Sinh test case theo format chuẩn TestReport.xlsx & Report5_UnitTest.xlsx
"""

import os
import anthropic
import streamlit as st
from pathlib import Path
from prompts import SYSTEM_TEST_PROMPT, UNIT_TEST_PROMPT
from excel_writer import parse_markdown_table, write_to_test_report

# Đường dẫn file TestReport.xlsx (cùng thư mục cha với thư mục agent/)
TEST_REPORT_PATH = Path(__file__).parent.parent / "TestReport.xlsx"

# Load .env nếu tồn tại (optional)
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

# Groq dùng OpenAI-compatible SDK — import lazy để không lỗi khi chưa cài
def _get_groq_client(api_key: str):
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except ImportError:
        st.error("❌ Chưa cài groq SDK. Chạy: `pip install groq`")
        st.stop()

# ------------------------------------------------------------------
# Cấu hình trang
# ------------------------------------------------------------------
st.set_page_config(
    page_title="SWT301 — Test Case Generator",
    page_icon="🧪",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ------------------------------------------------------------------
# Sidebar — Cấu hình
# ------------------------------------------------------------------
with st.sidebar:
    st.title("⚙️ Cấu hình")

    # --- Chọn provider ---
    provider = st.radio(
        "AI Provider",
        options=["Anthropic (Claude)", "Groq (Miễn phí)"],
        index=0,
        help="Groq miễn phí, nhanh hơn. Claude chất lượng output tốt hơn.",
    )

    is_groq = provider == "Groq (Miễn phí)"

    if is_groq:
        api_key = st.text_input(
            "Groq API Key",
            value=os.getenv("GROQ_API_KEY", ""),
            type="password",
            placeholder="gsk_...",
            help="Lấy tại https://console.groq.com/keys — Miễn phí 14,400 req/ngày",
        )
        model_choice = st.selectbox(
            "Model",
            options=[
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant",
                "gemma2-9b-it",
            ],
            index=0,
            help="llama-3.3-70b: chất lượng tốt nhất. llama-3.1-8b: nhanh nhất.",
        )
    else:
        api_key = st.text_input(
            "Anthropic API Key",
            value=os.getenv("ANTHROPIC_API_KEY", ""),
            type="password",
            placeholder="sk-ant-api03-...",
            help="Lấy tại https://console.anthropic.com/settings/api-keys",
        )
        model_choice = st.selectbox(
            "Model",
            options=[
                "claude-haiku-4-5-20251001",
                "claude-sonnet-4-6",
            ],
            index=0,
            help="Haiku: nhanh & rẻ (khuyên dùng). Sonnet: chất lượng cao hơn.",
        )

    max_tokens = st.slider("Max tokens output", 1024, 8192, 4096, 256)

    st.divider()
    st.markdown("**📂 File mẫu (SWT/)**")
    st.markdown("- `1737_DN_SE_48_Report5_TestReport.xlsx`")
    st.markdown("- `1737_DN_SE_48_Report5_UnitTest.xlsx`")

    st.divider()
    st.markdown("**📋 Quy trình sử dụng**")
    st.markdown("1. Chọn provider & nhập API Key")
    st.markdown("2. Chọn tab phù hợp")
    st.markdown("3. Mô tả tính năng hoặc paste code hàm")
    st.markdown("4. Nhấn nút sinh → copy vào Excel")

    st.divider()
    st.warning(
        "⚠️ **Quan trọng**: Review kỹ output AI trước khi nộp bài. "
        "Không copy-paste mù quáng theo quy định sử dụng AI của giảng viên."
    )


# ------------------------------------------------------------------
# Helper — Gọi AI API (streaming, hỗ trợ Claude & Groq)
# ------------------------------------------------------------------
def call_claude(system_prompt: str, user_message: str) -> str:
    if not api_key:
        provider_label = "Groq" if is_groq else "Anthropic"
        st.error(f"❌ Chưa nhập {provider_label} API Key ở sidebar!")
        st.stop()

    output_placeholder = st.empty()
    full_text = ""

    if is_groq:
        client = _get_groq_client(api_key)
        stream = client.chat.completions.create(
            model=model_choice,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_text += delta
            output_placeholder.markdown(full_text + "▌")
    else:
        client = anthropic.Anthropic(api_key=api_key)
        with client.messages.stream(
            model=model_choice,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            for text_chunk in stream.text_stream:
                full_text += text_chunk
                output_placeholder.markdown(full_text + "▌")

    output_placeholder.markdown(full_text)
    return full_text


# ------------------------------------------------------------------
# Header
# ------------------------------------------------------------------
st.title("🧪 SWT301 — Test Case Generator")
st.caption(
    "Dự án: **Mạng xã hội thuê trọ trực tuyến** (Spring Boot / Next.js / PostgreSQL) · "
    "FPT University · SWT301"
)
st.divider()

# ------------------------------------------------------------------
# Tabs
# ------------------------------------------------------------------
tab_system, tab_unit = st.tabs(
    ["📋 Sinh System Test  →  TestReport.xlsx", "🔬 Sinh Unit Test  →  Report5_UnitTest.xlsx"]
)

# ══════════════════════════════════════════════════════════════════
# TAB 1 — System Test
# ══════════════════════════════════════════════════════════════════
with tab_system:
    st.subheader("📋 Sub-Agent 1: System Test Chief")
    st.markdown(
        "Sinh Test Case cho sheet module trong **TestReport.xlsx**. "
        "Agent áp dụng EP / BVA / Decision Table theo chuẩn ISTQB."
    )
    st.divider()

    col_left, col_right = st.columns([1, 1], gap="large")

    with col_left:
        module = st.selectbox(
            "Module / Sheet name",
            [
                "Authentication",
                "Room Management",
                "Search & Filter",
                "Social Features",
                "Post Approval",
                "Profile Management",
                "Payment Plan",
                "KYC Verification",
                "Rental Contract",
                "Deposit & Dispute",
                "Payout Management",
            ],
            help="Chọn module tương ứng với tên sheet trong TestReport.xlsx",
        )

        feature_desc = st.text_area(
            "Mô tả tính năng cần test ✏️",
            height=220,
            placeholder=(
                "Ví dụ:\n"
                "Chủ trọ đăng tin phòng trọ mới với các thông tin:\n"
                "- Tiêu đề bài đăng (10–200 ký tự)\n"
                "- Giá thuê: 500,000 – 50,000,000 VND/tháng\n"
                "- Diện tích: 10 – 200 m²\n"
                "- Địa chỉ, mô tả, tiện ích (checkbox)\n"
                "- Upload tối đa 10 ảnh, mỗi ảnh < 5MB, định dạng JPG/PNG\n"
                "Admin cần duyệt bài trước khi bài hiển thị công khai."
            ),
        )

        extra_rules = st.text_area(
            "Ràng buộc nghiệp vụ bổ sung (tùy chọn)",
            height=80,
            placeholder="Ví dụ: Chỉ Chủ trọ mới được đăng bài. Người thuê không có quyền truy cập form đăng tin.",
        )

        with st.expander("📂 Code Context — Paste code thực tế để agent sinh Expected Results chính xác hơn"):
            st.caption(
                "Càng cung cấp nhiều code thực tế, Expected Results càng cụ thể "
                "(URL đúng, HTTP status đúng, error message đúng nguyên văn). "
                "👉 **Code mẫu sẵn có**: `agent/contexts/auth_context.md` (module Authentication) — "
                "chỉ cần copy từng ô vào 3 field bên dưới."
            )
            code_dto = st.text_area(
                "1. DTO / Request class (validation annotations)",
                height=160,
                placeholder=(
                    "// Paste DTO với @Valid annotations\n"
                    "@Data\n"
                    "public class RegisterRequest {\n"
                    "    @NotBlank @Size(min=2, max=50)\n"
                    "    @Pattern(regexp=\"^[a-zA-ZÀ-ỹ\\\\s]+$\", message=\"Họ tên không được chứa số hoặc ký tự đặc biệt\")\n"
                    "    private String fullName;\n\n"
                    "    @Email(message=\"Email không hợp lệ\")\n"
                    "    @NotBlank\n"
                    "    private String email;\n"
                    "    // ...\n"
                    "}"
                ),
            )
            code_controller = st.text_area(
                "2. Controller (endpoint URLs, HTTP methods, response type)",
                height=130,
                placeholder=(
                    "// Paste phần @RestController liên quan\n"
                    "@PostMapping(\"/api/v1/auth/register\")\n"
                    "public ResponseEntity<ApiResponse<AuthResponse>> register(\n"
                    "        @RequestBody @Valid RegisterRequest request) { ... }\n\n"
                    "@PostMapping(\"/api/v1/auth/login\")\n"
                    "public ResponseEntity<ApiResponse<AuthResponse>> login(...) { ... }"
                ),
            )
            code_exception = st.text_area(
                "3. Exception Handler (error messages thực tế trả về)",
                height=130,
                placeholder=(
                    "// Paste GlobalExceptionHandler hoặc các message lỗi thực tế\n"
                    "@ExceptionHandler(MethodArgumentNotValidException.class)\n"
                    "// Trả về: {\"success\": false, \"message\": \"[field]: [annotation message]\"}\n\n"
                    "// Hoặc chỉ cần paste các message string:\n"
                    "// \"Email already exists in the system\"\n"
                    "// \"Phone number already registered\"\n"
                    "// \"Invalid credentials\""
                ),
            )

        # Cảnh báo khi chưa có code context
        _has_ctx = any([code_dto.strip(), code_controller.strip(), code_exception.strip()])
        if not _has_ctx:
            context_files = {
                "Authentication": "auth_context.md",
                "Room Management": "room_management_context.md",
                "Search & Filter": "search_filter_context.md",
                "Social Features": "social_features_context.md",
                "Post Approval": "post_approval_context.md",
                "Profile Management": "profile_management_context.md",
                "Payment Plan": "payment_plan_context.md",
                "KYC Verification": "kyc_verification_context.md",
                "Rental Contract": "rental_contract_context.md",
                "Deposit & Dispute": "deposit_dispute_context.md",
                "Payout Management": "payout_management_context.md"
            }
            ctx_file = context_files.get(module, "auth_context.md")
            st.warning(
                "⚠️ **Chưa có Code Context** — Expected Results sẽ là ước tính, "
                "có thể sai HTTP status hoặc error message. "
                "Mở expander phía trên, paste code DTO/Controller/ExceptionHandler để tăng độ chính xác. "
                f"Xem code mẫu: `agent/contexts/{ctx_file}`"
            )

        gen_system = st.button(
            "🚀 Sinh System Test Cases",
            type="primary",
            use_container_width=True,
            disabled=not feature_desc.strip(),
        )

    with col_right:
        st.markdown("**📌 Kết quả — Copy vào TestReport.xlsx**")

        if gen_system:
            user_msg_parts = [
                f"Module: {module}",
                f"\nTính năng cần test:\n{feature_desc.strip()}",
            ]
            if extra_rules.strip():
                user_msg_parts.append(f"\nRàng buộc nghiệp vụ bổ sung:\n{extra_rules.strip()}")

            # Đính kèm code context nếu có — giúp agent sinh Expected Results chính xác
            has_code_context = any([
                code_dto.strip(),
                code_controller.strip(),
                code_exception.strip(),
            ])
            if has_code_context:
                user_msg_parts.append("\n--- CODE CONTEXT (ưu tiên cao — dùng để sinh Expected Results chính xác) ---")
                if code_dto.strip():
                    user_msg_parts.append(f"\n[DTO / Request class]:\n```java\n{code_dto.strip()}\n```")
                if code_controller.strip():
                    user_msg_parts.append(f"\n[Controller endpoints]:\n```java\n{code_controller.strip()}\n```")
                if code_exception.strip():
                    user_msg_parts.append(f"\n[Exception Handler / Error messages]:\n```java\n{code_exception.strip()}\n```")
            else:
                user_msg_parts.append(
                    "\n[CẢNH BÁO: KHÔNG CÓ CODE CONTEXT] — "
                    "Không có code thực tế. Khi sinh Expected Results, với mỗi TC hãy thêm chú thích "
                    "'*(cần verify với code thực tế)*' vào cuối cột Expected Results cho các trường hợp "
                    "liên quan đến HTTP status code và error message string cụ thể."
                )

            # Ép buộc ngôn ngữ Tiếng Anh cho bảng Test Case
            user_msg_parts.append(
                "\n[CRITICAL REQUIREMENT]\n"
                "You must write the entire 'Bảng Test Cases' (Markdown Table) in ENGLISH. "
                "All column values for 'Test Case Description', 'Pre-conditions', 'Test Case Procedure', "
                "'Test Data', and 'Expected Results' (except verbatim error strings from the Java code/annotations) "
                "MUST be in English. DO NOT write the table content in Vietnamese."
            )

            user_msg = "\n".join(user_msg_parts)

            with st.spinner("Đang sinh test cases..."):
                try:
                    result = call_claude(SYSTEM_TEST_PROMPT, user_msg)
                    st.session_state["system_result"] = result
                except anthropic.AuthenticationError:
                    st.error("❌ API Key không hợp lệ. Kiểm tra lại ở sidebar.")
                    st.stop()
                except Exception as e:
                    st.error(f"❌ Lỗi: {e}")
                    st.stop()

        if "system_result" in st.session_state and not gen_system:
            st.markdown(st.session_state["system_result"])

        if "system_result" in st.session_state:
            st.divider()
            dl_col1, dl_col2 = st.columns(2)
            with dl_col1:
                st.download_button(
                    "📥 Tải về (.md)",
                    data=st.session_state["system_result"],
                    file_name=f"TC_{module.replace(' ', '_')}.md",
                    mime="text/markdown",
                    use_container_width=True,
                )
            with dl_col2:
                st.download_button(
                    "📥 Tải về (.txt)",
                    data=st.session_state["system_result"],
                    file_name=f"TC_{module.replace(' ', '_')}.txt",
                    mime="text/plain",
                    use_container_width=True,
                )

            # ── Xuất thẳng vào TestReport.xlsx ──────────────────────────
            st.divider()
            st.markdown("**📤 Xuất thẳng vào TestReport.xlsx**")

            xlsx_exists = TEST_REPORT_PATH.exists()
            if not xlsx_exists:
                st.warning(
                    f"⚠️ Không tìm thấy file TestReport.xlsx tại: `{TEST_REPORT_PATH}`. "
                    "Đảm bảo file tồn tại trong thư mục `SWT/`."
                )
            else:
                overwrite_choice = st.radio(
                    "Chế độ ghi:",
                    options=["✏️ Ghi đè (Overwrite)", "➕ Nối tiếp (Append)"],
                    index=0,
                    horizontal=True,
                    help="Overwrite: xóa dữ liệu cũ trong sheet rồi ghi mới.\n"
                         "Append: giữ dữ liệu cũ, ghi tiếp từ dòng trống kế tiếp.",
                )
                do_overwrite = overwrite_choice.startswith("✏️")

                if st.button(
                    f"📤 Xuất vào sheet '{module}'",
                    type="secondary",
                    use_container_width=True,
                    key="btn_export_excel",
                ):
                    with st.spinner("Đang ghi vào Excel..."):
                        md_text = st.session_state["system_result"]
                        headers, rows = parse_markdown_table(md_text)

                        if not rows:
                            st.error(
                                "❌ Không parse được bảng Test Cases từ output AI. "
                                "Đảm bảo output có bảng Markdown chứa cột 'Test Case ID'."
                            )
                        else:
                            success, msg = write_to_test_report(
                                xlsx_path=TEST_REPORT_PATH,
                                module=module,
                                headers=headers,
                                rows=rows,
                                overwrite=do_overwrite,
                            )
                            if success:
                                st.success(msg)
                                st.info(
                                    "💡 Mở lại **TestReport.xlsx** để xem kết quả. "
                                    "Nhớ review lại dữ liệu trước khi nộp báo cáo."
                                )
                            else:
                                st.error(msg)

# ══════════════════════════════════════════════════════════════════
# TAB 2 — Unit Test
# ══════════════════════════════════════════════════════════════════
with tab_unit:
    st.subheader("🔬 Sub-Agent 2: Backend Unit Test Specialist")
    st.markdown(
        "Sinh Unit Test Cases cho sheet **VTFP-XX** trong **Report5_UnitTest.xlsx**. "
        "Agent phân tích EP/BVA và sinh ma trận Condition–Confirmation."
    )
    st.divider()

    col_left2, col_right2 = st.columns([1, 1], gap="large")

    with col_left2:
        fn_code_id = st.text_input(
            "Function Code",
            placeholder="RSTS-01",
            help="Mã hàm trong sheet Functions (RSTS-01, RSTS-02...). Để trống sẽ tự sinh.",
        )

        fn_class = st.text_input(
            "Class Name",
            placeholder="RoomServlet / UserDAO / ValidationUtil...",
        )

        java_code = st.text_area(
            "Paste code hàm Java ✏️",
            height=280,
            placeholder=(
                "Ví dụ:\n\n"
                "// Kiểm tra giá phòng trọ hợp lệ\n"
                "public boolean validateRoomPrice(double price) {\n"
                "    // Giá hợp lệ: 500,000 – 50,000,000 VND\n"
                "    if (price < 500_000 || price > 50_000_000) {\n"
                "        throw new IllegalArgumentException(\n"
                "            \"Giá phòng phải từ 500,000 đến 50,000,000 VND\");\n"
                "    }\n"
                "    return true;\n"
                "}\n\n"
                "Hoặc chỉ cần mô tả:\n"
                "Hàm checkUsernameAvailable(String username):\n"
                "- username: 6–50 ký tự, chỉ a-z/A-Z/0-9/_\n"
                "- Trả về true nếu chưa tồn tại trong DB\n"
                "- Throw UsernameExistsException nếu đã có"
            ),
        )

        gen_unit = st.button(
            "🔬 Sinh Unit Test Cases",
            type="primary",
            use_container_width=True,
            disabled=not java_code.strip(),
        )

    with col_right2:
        st.markdown("**📌 Kết quả — Copy vào Report5_UnitTest.xlsx**")

        if gen_unit:
            code_id = fn_code_id.strip() or "RSTS-XX"
            class_name = fn_class.strip() or "(chưa cung cấp)"

            user_msg = (
                f"Function Code: {code_id}\n"
                f"Class Name: {class_name}\n\n"
                f"Code / Mô tả hàm:\n"
                f"```java\n{java_code.strip()}\n```"
            )

            with st.spinner("Đang phân tích EP/BVA và sinh unit test cases..."):
                try:
                    result = call_claude(UNIT_TEST_PROMPT, user_msg)
                    st.session_state["unit_result"] = result
                    st.session_state["unit_code_id"] = code_id
                except anthropic.AuthenticationError:
                    st.error("❌ API Key không hợp lệ. Kiểm tra lại ở sidebar.")
                    st.stop()
                except Exception as e:
                    st.error(f"❌ Lỗi: {e}")
                    st.stop()

        if "unit_result" in st.session_state and not gen_unit:
            st.markdown(st.session_state["unit_result"])

        if "unit_result" in st.session_state:
            st.divider()
            code_id_saved = st.session_state.get("unit_code_id", "RSTS-XX")
            dl_col1, dl_col2 = st.columns(2)
            with dl_col1:
                st.download_button(
                    "📥 Tải về (.md)",
                    data=st.session_state["unit_result"],
                    file_name=f"UnitTest_{code_id_saved}.md",
                    mime="text/markdown",
                    use_container_width=True,
                )
            with dl_col2:
                st.download_button(
                    "📥 Tải về (.txt)",
                    data=st.session_state["unit_result"],
                    file_name=f"UnitTest_{code_id_saved}.txt",
                    mime="text/plain",
                    use_container_width=True,
                )

# ------------------------------------------------------------------
# Footer
# ------------------------------------------------------------------
st.divider()
st.caption(
    "SWT301 Test Case Generator · Powered by Anthropic Claude · "
    "Nhớ review output trước khi nộp bài 🎓"
)
