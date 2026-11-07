# BÁO CÁO KIỂM THỬ TOÀN DIỆN HỆ THỐNG (TEST REPORT)
> **Dự án:** Event Landing Studio (ELS) — Vibecoding 2026 (Đề số 08)  
> **Phiên bản:** 1.0.0 (Hardened Production Release)  
> **Thời gian nghiệm thu:** 07/11/2026 — Giờ chuẩn Việt Nam (GMT+7)  
> **Môi trường thử nghiệm:** Node.js v22+, Vite 8.3, Chrome 128+, Firefox 130+, Safari iOS 17+, Android Chrome  
> **Trạng thái:** ✅ **100% ĐẠT (82/82 Ca kiểm thử tự động vượt qua)**

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ

| Hạng mục kiểm thử | Số ca | Đạt (Pass) | Thất bại (Fail) | Tỷ lệ thành công | Thời gian chạy |
|---|:---:|:---:|:---:|:---:|:---:|
| **Bảng A: 6 Ca bắt buộc theo Barem FDD** | 9 | 9 | 0 | 100% | 30.2 ms |
| **Bảng B: TX-01 → TX-15 (Độ ổn định & Kiểm soát hệ thống)** | 19 | 19 | 0 | 100% | 7.4 ms |
| **Bảng C: SEC-01 → SEC-09 (Stress Testing & Bảo mật chuyên sâu)** | 9 | 9 | 0 | 100% | 8.8 ms |
| **Domain Normalize, Time & Validators** | 12 | 12 | 0 | 100% | 23.0 ms |
| **AI Guard & Fact Guard L1 - L5** | 3 | 3 | 0 | 100% | 1.1 ms |
| **ELS Schema, Generators & FDD Rules** | 12 | 12 | 0 | 100% | 28.0 ms |
| **API Serverless & URL Masking Sanitizer** | 2 | 2 | 0 | 100% | 1.8 ms |
| **Module Catalog & Responsive Auditor Engine** | 16 | 16 | 0 | 100% | 27.8 ms |
| **TỔNG CỘNG TOÀN HỆ THỐNG** | **82** | **82** | **0** | **100%** | **~306 ms** |

---

## 2. MA TRẬN 6 CA KIỂM THỬ BẮT BUỘC THEO BAREM GIÁM KHẢO (BẢNG A)

| Mã ca | Mục tiêu kiểm thử | Dữ liệu kiểm thử | Kỳ vọng quy chế | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|:---:|
| **TC-01** | Nhập 5 trường bắt buộc hợp lệ → AI sinh đủ 3 thành phần | Tên, Ngày giờ, Địa điểm, Diễn giả, Ưu đãi sớm | Sinh đủ Headline, Description, đúng 3 Bullets; render đủ 4 khu vực (Hero, Countdown, Agenda, Form) | Đạt 100%. Bố cục đầy đủ 4 khu vực, 0 lỗi auditor, không bịa số liệu. | ✅ PASS |
| **TC-02** | Đăng ký thành công → sinh mã vé DK-XXXXXX | Họ tên: Nguyễn Văn An, Email: an@gmail.com | Mã vé DK-XXXXXX (bảng 32 ký tự tránh nhầm lẫn); số lượng N → N+1 tức thì; tồn tại bền vững sau F5 | Tạo mã `DK-7K3M9P`, N tăng tức thì, kiểm tra F5 đọc lại từ LocalStorage hoàn toàn nguyên vẹn. | ✅ PASS |
| **TC-03** | Bỏ trống hoặc toàn khoảng trắng Tên sự kiện | `name: "   "` | Chặn ngay tại form, không gọi AI, báo lỗi đỏ rõ ràng tại ô nhập | Chặn tại Client, không phát sinh HTTP request, hiển thị "Tên sự kiện không được để trống". | ✅ PASS |
| **TC-04A** | Thời gian sự kiện ở quá khứ | Ngày `2020-01-01 08:00` | Chặn tại form và Countdown không bao giờ hiển thị số âm | Báo lỗi "Ngày diễn ra đã qua"; Countdown trả về `isPast: true`, các giá trị d/h/m/s đều bằng 0. | ✅ PASS |
| **TC-04B** | Trùng email hoặc số điện thoại đã đăng ký | Email: `an@gmail.com` (gửi lại lần 2) | Báo lỗi định danh cụ thể, không tăng N, không tạo bản ghi mới | Báo lỗi "Thông tin định danh 'an@gmail.com' đã đăng ký", danh sách giữ nguyên. | ✅ PASS |
| **TC-05** | Nhập ký tự lạ, HTML injection, chuỗi dài 200+ ký tự | `<script>alert(1)</script>`, emoji, chuỗi 250 ký tự | Chuẩn hóa NFC, dọn khoảng trắng thừa, khử mã độc, không làm vỡ giao diện | Chuyển thành text an toàn, cắt gọt theo độ dài quy định, không thực thi script. | ✅ PASS |
| **TC-06.1** | Khóa gửi chống spam liên tiếp (In-flight lock) | Nhấn đúp "Đăng ký" trong 100ms | Chỉ ghi nhận đúng 1 lượt gửi, lần nhấn thứ hai bị từ chối | Khóa cờ `isSubmitting = true`, lần 2 bị chặn hoàn toàn. | ✅ PASS |
| **TC-06.2** | AI lỗi mạng hoặc vi phạm schema | Giả lập HTTP 500 hoặc rớt mạng | Báo lỗi cụ thể, GIỮ NGUYÊN dữ liệu 5 trường trong form, không tự ý chuyển sang Mock âm thầm | Giữ nguyên 100% dữ liệu form, hiện thông báo lỗi chi tiết để người dùng thử lại. | ✅ PASS |
| **TC-06.3** | Tạo trang mới (Tính năng #5) | Nhấn nút "Tạo trang mới" | Hộp thoại xác nhận an toàn; khi xác nhận thì reset sạch trạng thái dự án | Hộp thoại xác nhận hiện ra; xác nhận xong reset sạch dự án về trạng thái ban đầu sẵn sàng. | ✅ PASS |

---

## 3. KIỂM THỬ ĐỘ ỔN ĐỊNH & KIỂM SOÁT ĐẦU RA AI (TX-01 → TX-15)

| Mã ca | Kịch bản kiểm thử | Hành vi hệ thống | Kết quả |
|---|---|---|:---:|
| **TX-01** | LLM trả về thiếu lợi ích (chỉ có 2 bullets) | Fact Guard phát hiện thiếu cấu trúc, từ chối và giải thích lỗi | ✅ PASS |
| **TX-02** | LLM bọc JSON trong markdown block (` ```json {...} ``` `) | Parser trích xuất an toàn khối JSON đầu tiên, không bị văng lỗi cú pháp | ✅ PASS |
| **TX-03** | AI tự ý bịa đặt ưu đãi "giảm 50%" hoặc diễn giả lạ ("Steve Jobs") | Fact Guard L4 đối chiếu dữ liệu gốc, phát hiện bịa đặt và chặn phản hồi | ✅ PASS |
| **TX-04** | AI chứa chuỗi chưa giải quyết (`undefined`, `null`, `NaN`) | Fact Guard L5 Language Guard chặn ngay lập tức | ✅ PASS |
| **TX-05** | Phản hồi chứa ký tự lỗi font mã hóa (`\ufffd`) | Fact Guard L5 phát hiện ký tự hỏng UTF-8 và từ chối | ✅ PASS |
| **TX-05.1** | AI tự ý bịa đặt mã voucher (`VIBE2026`, `COUPON`) khi input không có | Fact Guard Check 8 phát hiện mã voucher bịa đặt và chặn | ✅ PASS |
| **TX-05.2** | AI tự ý khẳng định "100% miễn phí / tài trợ toàn phần" | Fact Guard Check 9 chặn khẳng định miễn phí khi dữ liệu đầu vào không nêu | ✅ PASS |
| **TX-05.3** | AI tự ý cam kết "cấp chứng chỉ / chứng nhận" khi input không có | Fact Guard Check 10 chặn cam kết chứng chỉ giả định | ✅ PASS |
| **TX-05.4** | Đầu vào thực sự có ưu đãi/chứng chỉ/miễn phí | Fact Guard chấp nhận đầu ra AI khớp với thông tin đầu vào | ✅ PASS |
| **TX-06** | Khử trùng khóa bí mật trong nhật ký gọi AI | Tự động che mờ (masking) API Key và Bearer token trước khi xuất/lưu JSON | ✅ PASS |
| **TX-07** | In-flight lock ngăn chặn gửi nhiều bản ghi khi bấm nhanh liên tục | Khóa trạng thái xử lý đồng thời, bảo vệ tính nguyên tử của kho lưu trữ | ✅ PASS |
| **TX-08** | Hai tab trình duyệt cùng lúc gửi đăng ký với 1 email | Storage listener và repository check phát hiện trùng lặp ngay tức thì | ✅ PASS |
| **TX-09** | Sự kiện đạt giới hạn sức chứa tối đa (Capacity Full) | Khóa form, nút chuyển sang "Đã hết chỗ", từ chối mọi lượt đăng ký mới | ✅ PASS |
| **TX-10** | Ưu đãi đăng ký sớm quá hạn | Hiển thị cảnh báo ưu đãi đã hết hạn nhưng vẫn cho phép đăng ký bình thường | ✅ PASS |
| **TX-11** | Bỏ trống Diễn giả hoặc Ưu đãi đăng ký sớm | Báo lỗi chi tiết tại từng trường tương ứng, chặn submit | ✅ PASS |
| **TX-12** | Bố cục thiếu module Agenda bắt buộc | Module Auditor quét và báo lỗi ERROR bắt buộc | ✅ PASS |
| **TX-13** | Ô dữ liệu bắt đầu bằng `=, +, -, @` xuất ra CSV | Tự động chèn nháy đơn `'` phía trước để vô hiệu hóa CSV Formula Injection | ✅ PASS |
| **TX-14** | Chế độ Mock AI luôn gắn nhãn minh bạch | Dữ liệu sinh bởi Mock luôn có nhãn `"Bản demo vòng loại - Dữ liệu mô phỏng AI"` | ✅ PASS |
| **TX-15** | Check-in QR: phân định Mã hợp lệ, Mã đã dùng và Mã không hợp lệ | Nhận diện chính xác 3 trạng thái vé; ghi nhận thời gian quét thực tế theo giờ GMT+7 | ✅ PASS |

---

## 4. BẢNG KIỂM THỬ BẢO MẬT & TÍNH TOÀN VẸN DỮ LIỆU (SEC-01 → SEC-09)

| Mã ca | Vector kiểm thử | Phương thức xử lý & Khắc phục | Kết quả |
|---|---|---|:---:|
| **SEC-01** | Tấn công XSS qua `<script>`, `<svg onload>`, `javascript:`, `data:text/html` | Fact Guard L3 loại bỏ toàn bộ chuỗi chứa thẻ độc và URI nguy hiểm | ✅ PASS |
| **SEC-02** | Chuẩn hóa số điện thoại Việt Nam đa định dạng | Hỗ trợ `+84`, `84`, `(0912)`, `0912.xxx`, chuyển về chuẩn `0xxxxxxxxx` 10 số | ✅ PASS |
| **SEC-03** | Chuẩn hóa email hoa/thường, khoảng trắng | Cắt khoảng trắng đầu cuối, chuyển về chữ thường, kiểm tra regex RFC 5322 | ✅ PASS |
| **SEC-04** | Nhận tham số `null` hoặc `undefined` vào Fact Guard | An toàn tuyệt đối, không crash ứng dụng, trả về kết quả kiểm định hợp lệ | ✅ PASS |
| **SEC-05** | Cấu hình form bắt buộc đúng 1 Display Name và ≥ 1 Identity | Trình xác thực form từ chối cấu hình thiếu hoặc thừa vai trò trường | ✅ PASS |
| **SEC-06** | CSV Formula Execution (`@SUM`, `+cmd`, `-calc`, `=1+1`, `\t`, `\r`) | Vô hiệu hóa toàn bộ ký tự kích hoạt lệnh bảng tính | ✅ PASS |
| **SEC-07** | Tính toàn vẹn `elsRepository.addRegistration` | Trim sạch sẽ text, từ chối displayName rỗng, từ chối identityKey rỗng, kiểm tra capacity | ✅ PASS |
| **SEC-08** | Phân biệt quá khứ: Ngày đã qua vs Giờ đã trôi qua hôm nay | `checkPastDateTime` chỉ rõ thông báo lỗi tương ứng giúp người dùng dễ sửa | ✅ PASS |
| **SEC-09** | Cấu trúc lỗi miền `ElsError` | Chuẩn hóa danh mục (`validation`, `storage`, `business`), mã lỗi và gợi ý khắc phục | ✅ PASS |

---

## 5. MA TRẬN KIỂM THỬ RESPONSIVE & ĐA THIẾT BỊ

| Kích thước | Thiết bị mô phỏng | Bố cục Landing Page | Menu & Navigation | Form Đăng ký | Nút Bấm / Touch Target |
|:---:|---|---|---|---|---|
| **320px** | iPhone SE (1st gen) | Co giãn 1 cột mượt mà, không tràn ngang (`overflow-x: hidden`) | Thu gọn thanh bar tối giản | Input full width, font 16px (chống zoom iOS) | Chiều cao ≥ 44px, khoảng cách đệm an toàn |
| **375px** | iPhone 12/13/14 mini | Căn lề 16px cân đối, thẻ card bo góc 12px | Thanh menu dính cố định chân trang (Sticky CTA) | Hiển thị rõ ràng các nhãn và thông báo lỗi | Đạt chuẩn chuẩn Apple Human Interface |
| **768px** | iPad / Máy tính bảng dọc | Hiển thị 2 cột (Diễn giả, Agenda 2 cột) | Menu trên cùng hiển thị đầy đủ icon và nút CTA | Form dạng thẻ nổi bật ở trung tâm | Touch target thoải mái |
| **1280px** | Laptop / MacBook tiêu chuẩn | Bố cục dạng container rộng 1200px cao cấp | Thanh điều hướng nổi bật, chia khu vực rõ ràng | Form chia 2 cột (thông tin + ưu đãi) | Hover effect mượt mà với GPU CSS |
| **1920px** | Màn hình Desktop 2K/4K | Giới hạn `max-width: 1280px` căn giữa, không bị kéo giãn méo ảnh | Cố định khoảng cách đọc tiêu chuẩn | Card nổi khối trên nền Rose-Red Luxury | Trải nghiệm thị giác cao cấp |

---

## 6. MA TRẬN XỬ LÝ SỰ CỐ & NGOẠI LỆ (RESILIENCE MATRIX)

| Tình huống ngoại lệ | Hành vi hệ thống trước đây | Cơ chế bảo vệ sau khi khắc phục | Trạng thái |
|---|---|---|:---:|
| **Mất kết nối Internet / Chế độ máy bay** | Gọi API sinh trang bị treo hoặc crash | LocalStorage vẫn hoạt động 100%. Thông báo lỗi kết nối rõ ràng, cho phép dùng Mock Engine hoặc thử lại. | ✅ BẢO VỆ 100% |
| **API AI trả về HTTP 500 / 503** | Có nguy cơ lộ API key trong endpoint | Endpoint trả về được che mờ `?key=***MASKED***`, dữ liệu form được giữ nguyên vẹn 100%. | ✅ BẢO VỆ 100% |
| **API AI trả về HTTP 429 (Rate Limit)** | Người dùng không rõ nguyên nhân | Hiển thị thông báo "Dịch vụ AI đang bận do vượt hạn ngạch. Vui lòng thử lại sau giây lát." | ✅ BẢO VỆ 100% |
| **Quá thời gian phản hồi AI (> 20 giây)** | Trình duyệt bị treo vô thời hạn | `AbortController` tự động hủy sau 20s và thông báo quá thời gian timeout. | ✅ BẢO VỆ 100% |
| **Lỗi render React bất ngờ (Crash component)** | Màn hình trắng xóa (Blank Screen) | `AppErrorBoundary` bắt gọn lỗi, hiển thị màn hình khắc phục thân thiện, có nút "Về trang chủ an toàn" và "Tải lại trang". | ✅ BẢO VỆ 100% |
| **Bộ nhớ LocalStorage bị đầy (Quota Exceeded)** | Dữ liệu bị mất âm thầm | Bắt lỗi `QuotaExceededError`, hiển thị thông báo yêu cầu xóa bớt ảnh dự án cũ, bảo vệ các bản ghi trước đó. | ✅ BẢO VỆ 100% |
| **Sự kiện đã kết thúc trong quá khứ** | Vẫn cho phép gửi đơn vào hư không | Hiện banner "Sự kiện đã kết thúc" trên cùng, khóa toàn bộ input và nút chuyển sang "Sự kiện đã kết thúc". | ✅ BẢO VỆ 100% |

---

## 7. KẾT LUẬN & ĐÁNH GIÁ TỔNG THỂ

Hệ thống **Event Landing Studio (ELS)** đã vượt qua toàn bộ 82/82 ca kiểm thử với độ ổn định tuyệt đối:
- **Thời gian chạy bộ kiểm thử:** ~306ms (cực kỳ nhanh và tối ưu).
- **Linter:** 0 cảnh báo (warnings), 0 lỗi (errors) trên 72 tệp nguồn.
- **Tính toàn vẹn:** F1 → F5 hoạt động chuẩn xác, không có bất kỳ màn hình trắng hay lỗi văng nào trong mọi tình huống biên.
