# Event Landing Studio (ELS) — Vibecoding 2026

> 🌐 **BẢN TRIỂN KHAI TRỰC TUYẾN CHÍNH THỨC (LIVE DEMO HTTPS):**  
> 👉 [https://vibecoding-landingpage.vercel.app](https://vibecoding-landingpage.vercel.app)  
> *(Trải nghiệm tức thì không cần cài đặt — Tương thích trên Desktop, Laptop, iPhone, iPad, Android)*

---

## 1. ĐỀ TÀI SỐ 08: TẠO LANDING PAGE SỰ KIỆN TRONG 5 PHÚT

- **Tên đề bài:** Đề số 08 — Hệ thống tạo Landing Page Sự kiện trong 5 phút ứng dụng AI Agentic Coding.
- **Tên sản phẩm:** **Event Landing Studio (ELS)**.
- **Cuộc thi:** Cuộc thi Vibe Coding 2026 — Bảng A (Công nghệ) & Bảng B (Kinh tế).
- **Mục tiêu sản phẩm:** Giải quyết bài toán tạo trang đích (landing page) sự kiện chuyên nghiệp với chi phí 0đ và thời gian dưới 5 phút cho nhà tổ chức sự kiện, câu lạc bộ, doanh nghiệp vừa và nhỏ (SME). Ứng dụng AI biên soạn nội dung chuẩn marketing, tự động phân bổ bố cục, cung cấp form đăng ký động chống trùng lặp, sinh mã vé kèm QR code check-in tức thì, hỗ trợ xuất danh sách CSV / Excel và thống kê thời gian thực.
- **Phạm vi hoàn thiện:** Web Application Responsive hoạt động độc lập 100% trên `localStorage` của trình duyệt (Offline-first) kết hợp Serverless Proxy bảo vệ khóa API và tiện ích đồng bộ QR đa thiết bị.

---

## 2. CÔNG NGHỆ SỬ DỤNG

| Lớp kiến trúc | Công nghệ / Thư viện | Vai trò & Mục đích kỹ thuật |
|---|---|---|
| **Frontend Framework** | **React 19.3 + Vite 8.3** | Xây dựng Single Page Application hiện đại với Code Splitting (`React.lazy` tách riêng Studio & QR Scanner khỏi trang công khai). |
| **Giao diện & Thẩm mỹ** | **Vanilla CSS Modules + Luxury Rose-Red Palette** | Bảng màu Đỏ Hồng Cao Cấp (`#e11d48`, `#be123c`, `#9f1239`) kết hợp Dark Titanium Slate (`#09090b`), 0 xung đột CSS toàn cục. |
| **Định tuyến & Trạng thái** | **Hash-based Routing (`useHashRoute`)** | Điều hướng không tải lại trang (`#/`, `#/p/:id/*`, `#/e/:slug`), hoạt động ổn định trên mọi static hosting (Vercel, GitHub Pages, Localhost) mà không bị lỗi 404 Rewrite. |
| **AI Engine & Fact Guard** | **Google Gemini 1.5 Flash + Local Fact Guard L1 - L5** | Tích hợp AI tạo nội dung tiếng Việt có rào chắn chống Prompt Injection (`escapePromptField`) và kiểm duyệt 10 quy tắc (chống XSS, chống bịa đặt voucher/giảm giá/diễn giả lạ/cam kết miễn phí/chứng chỉ). |
| **Mock Engine dự phòng** | **Deterministic Mock Content Generator** | Kích hoạt khi offline hoặc chưa cấu hình API key, luôn gắn nhãn minh bạch theo quy chế: *"Bản demo vòng loại - Dữ liệu mô phỏng AI"*. |
| **Serverless Backend** | **Vercel Serverless Functions (`api/*.js`)** | Giấu hoàn toàn khóa API phía máy chủ, kiểm tra HTTP Method (405), giới hạn payload 16KB (413), che mờ URL tránh rò rỉ token. |
| **Mã QR, CSV & Excel** | **qrcode + jsqr + SpreadsheetML Engine** | Sinh ảnh mã QR vé tham dự (`DK-XXXXXX`), quét vé camera trực tiếp trên điện thoại, xuất danh sách ra file `.csv` (UTF-8 BOM) và `.xls` (Excel có định dạng bảng) chống Formula Injection. |
| **Kiểm tra chất lượng** | **Oxlint + Node.js Built-in Test Runner** | **0 cảnh báo, 0 lỗi** (`oxlint` trên 56 tệp), **88/88 bài kiểm thử tự động** chạy trong ~360ms. |

---

## 3. 5 TÍNH NĂNG CỐT LÕI (F1 → F5 THEO BAREM CHẤM ĐIỂM)

### 🌟 F1: Nhập liệu thông tin sự kiện & Thư viện ảnh nguồn (Workspace 1)
- Thu thập đầy đủ **5 trường thông tin bắt buộc**: Tên sự kiện, Ngày diễn ra, Giờ bắt đầu, Địa điểm tổ chức, Diễn giả, Ưu đãi đăng ký sớm và Chương trình (Agenda).
- Kiểm tra tính hợp lệ tức thì: Chặn tên rỗng, chặn ngày giờ quá khứ, phân định rõ ngày đã qua và giờ đã trôi qua trong ngày theo múi giờ chuẩn Việt Nam (`GMT+7`).
- **Thư viện ảnh nguồn (Asset Library)**: Hỗ trợ tải lên tối đa 8 ảnh (JPG, PNG, WebP), tự động nén HTML5 Canvas cạnh dài ≤ 1280px, gán vai trò (`speaker`, `venue`, `gift`, `other`) và mô tả ảnh.

### 🤖 F2: AI Copywriting thông minh & Fact Guard chống ảo giác (Workspace 3)
- AI phân tích dữ liệu đầu vào để biên soạn đúng **3 thành phần cốt lõi**: Headline (10–12 từ lôi cuốn), Description (2–3 câu sâu sắc), và đúng 3 Bullets lợi ích thiết thực.
- **Fact Guard & Output Control 10 quy tắc**: Chặn mã độc XSS, chặn ký tự hỏng UTF-8, chặn chuỗi `undefined/null`, và **chống AI tự ý bịa đặt mã giảm giá (voucher), cam kết miễn phí 100% hoặc cam kết cấp chứng chỉ** khi dữ liệu đầu vào không nhắc tới.
- Cho phép người dùng chỉnh sửa tay trực tiếp từng trường nội dung.

### 📱 F3: Xem trước tương tác Responsive 2 thiết bị (Workspace 3)
- Render đầy đủ **4 khu vực bắt buộc** trên Landing Page: **Hero Section**, **Đồng hồ đếm ngược (Countdown)**, **Lịch trình (Agenda)**, và **Biểu mẫu đăng ký (Registration Form)**.
- Chuyển đổi tức thì giữa 2 khung màn hình: **Laptop (1280px)** và **Điện thoại (375px)**, đồng thời đáp ứng mượt mà trên màn hình nhỏ **320px** mà không tràn ngang (`overflow-x: hidden`).
- Giao diện di động của Studio có thanh điều hướng 4 Workspace kèm **nút Quét QR** chuyên dụng nằm chính giữa (giữa *2. Form đăng ký* và *3. Preview*).

### 🎫 F4: Form đăng ký động, Sinh mã vé DK-XXXXXX, Xuất CSV/Excel & Thống kê thời gian thực (Workspace 2 & 4)
- Đăng ký thành công tức thì:
  - Sinh mã vé độc nhất dạng **`DK-XXXXXX`** (bảng 32 ký tự loại bỏ 0/O, 1/I dễ nhầm lẫn).
  - Tự động tạo ảnh mã QR vé check-in cho phép tải về máy hoặc thêm lịch `.ics`.
  - Số lượng người đăng ký tăng ngay tức thì **$N \rightarrow N+1$**, chống trùng lặp Email và Số điện thoại (sau khi chuẩn hóa `+84` → `0`).
  - **Bảo toàn dữ liệu sau `F5`**: Lưu trữ nguyên tử trong `localStorage` kèm cơ chế đọc kiểm chứng và bắt lỗi đầy bộ nhớ (`QuotaExceededError`).
  - **Xuất dữ liệu tiện lợi**: Hỗ trợ xuất danh sách người tham gia ra cả định dạng **CSV (`.csv`)** và **Excel (`.xls`)** có chống Formula Injection.

### 🔄 F5: Tạo trang mới (Reset sạch dự án an toàn)
- Nút "Tạo trang mới" trên thanh công cụ trên cùng mở **hộp thoại xác nhận 2 bước (Modal Dialog)** giúp tránh bấm nhầm.
- Khi xác nhận: Khởi tạo dự án sự kiện mới với trạng thái sạch hoàn toàn, sẵn sàng tạo landing page tiếp theo.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 4.1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.0 trở lên (khuyến nghị Node.js v20 hoặc v22 LTS).
- **Trình duyệt**: Google Chrome, Microsoft Edge, Mozilla Firefox hoặc Safari phiên bản mới nhất.

### 4.2. Khởi chạy nhanh bằng lệnh Terminal
```bash
# 1. Cài đặt các gói thư viện
npm install

# 2. (Tùy chọn) Tạo file .env từ .env.example nếu muốn dùng Gemini API thật ở local
cp .env.example .env

# 3. Khởi chạy máy chủ phát triển (Dev Server)
npm run dev
# Mở trình duyệt truy cập: http://localhost:5173

# 4. Chạy toàn bộ 88 ca kiểm thử tự động
npm test

# 5. Kiểm tra chất lượng mã nguồn (Linter - 0 lỗi)
npm run lint

# 6. Rà soát bí mật và đường dẫn cá nhân
npm run scan:secrets

# 7. Đóng gói bài thi tự động thành file .zip nghiệm thu
npm run package:submission

# 8. Biên dịch bản sản xuất (Production Build)
npm run build
```

---

### 4.3. BỘ DỮ LIỆU MẪU 5 TRƯỜNG BẮT BUỘC (DÀNH CHO GIÁM KHẢO KIỂM THỬ TRONG 30 GIÂY)

Giám khảo có thể sao chép nhanh dữ liệu chuẩn dưới đây và dán vào Workspace 1 để kiểm tra toàn bộ luồng F1 → F5:

| STT | Trường thông tin | Dữ liệu mẫu kiểm thử chuẩn (Copy & Paste) |
|:---:|---|---|
| **1** | **Tên sự kiện** | `Workshop Chinh Phục Vibe Coding & AI 2026` |
| **2** | **Ngày diễn ra** | `2026-11-20` *(hoặc chọn bất kỳ ngày nào trong tương lai)* |
| **3** | **Giờ bắt đầu** | `09:00` *(Giờ chuẩn Việt Nam GMT+7)* |
| **4** | **Địa điểm tổ chức** | `Hội trường Innovation Hub, Tầng 3, Tòa nhà Công nghệ, Hà Nội` |
| **5** | **Diễn giả chính** | `TS. Nguyễn Văn An` — Chức danh: `Chuyên gia Trưởng AI` |
| **+** | **Ưu đãi đăng ký sớm** | `Tặng bộ tài liệu VIP và giảm 30% cho 50 vé đầu tiên` |

---

## 5. TUYÊN BỐ SỬ DỤNG AI (AI DECLARATION)

Nhằm đảm bảo tính minh bạch theo quy chế Hội đồng Giám khảo Cuộc thi Vibe Coding 2026:

1. **Mô hình AI sử dụng trong sản phẩm:**
   - Ứng dụng tích hợp mô hình **Google Gemini 1.5 Flash** (`gemini-1.5-flash`) thông qua Serverless Proxy `/api/generate` (Node.js), **không để lộ API key trong client bundle hay URL trả về**.
2. **Chế độ Mock AI Engine dự phòng:**
   - Khi chạy offline hoặc chưa cấu hình `VITE_GEMINI_API_KEY`, hệ thống cho phép sử dụng **Mock AI Engine** cục bộ (`src/services/mockAi.js`).
   - Mọi nội dung sinh bởi Mock Engine đều gắn nhãn minh bạch cố định trên giao diện:  
     `"Bản demo vòng loại - Dữ liệu mô phỏng AI"`.
3. **Kiểm soát đầu ra (Fact Guard):**
   - Toàn bộ đầu ra AI đều đi qua bộ lọc `runAiGuard()` (`src/domain/aiGuard.js`) để kiểm tra định dạng JSON, kiểm tra đủ 3 thành phần và đối chiếu chống bịa đặt thông tin ngoài dữ liệu đầu vào.

---

## 6. GIỚI HẠN SẢN PHẨM TRUNG THỰC (HONEST PRODUCT LIMITATIONS)

1. **Lưu trữ dữ liệu cục bộ (`localStorage`):**
   - Toàn bộ dự án và danh sách đăng ký được lưu trữ trong `localStorage` của trình duyệt theo đúng yêu cầu đề bài không bắt buộc Database rời. Nếu người dùng xóa dữ liệu duyệt web (Clear Site Data) hoặc mở ở chế độ Ẩn danh mới hoàn toàn mà không qua link đồng bộ, dữ liệu cục bộ cũ sẽ không còn.
2. **Đồng bộ đa thiết bị:**
   - Khi chạy trên cùng trình duyệt (nhiều tab), dữ liệu đồng bộ tức thì 100% qua `BroadcastChannel` và sự kiện `storage`. Khi quét QR từ điện thoại sang máy tính qua mạng LAN / Cloudflare Tunnel / Vercel, hệ thống sử dụng kênh đồng bộ tạm thời (`/api/sync/*`) để truyền dự án và đơn đăng ký.
3. **Phụ thuộc hạn ngạch API AI bên ngoài:**
   - Lệnh gọi AI trực tiếp phụ thuộc vào hạn ngạch (quota) của Google Gemini API. Khi vượt quá giới hạn tần suất (HTTP 429) hoặc mất kết nối mạng, hệ thống giữ nguyên dữ liệu người dùng đã nhập và hiển thị thông báo rõ ràng.

---

## 7. NGUỒN THAM KHẢO & THƯ VIỆN BÊN THỨ BA

Tất cả các thư viện sử dụng trong dự án đều là mã nguồn mở với giấy phép thương mại tự do (MIT / Apache 2.0):

- **React & React DOM (v19.3.1)** — Giấy phép MIT.
- **Vite (v8.3.4)** — Giấy phép MIT.
- **qrcode (v1.5.4)** — Giấy phép MIT — Sinh ảnh mã QR vé tham dự.
- **jsqr (v1.4.0)** — Giấy phép Apache 2.0 — Nhận diện mã QR từ camera khi check-in.
- **Oxlint (v1.88.0)** — Giấy phép MIT — Kiểm tra chất lượng mã nguồn tĩnh.

---

## 8. CHECKLIST AN TOÀN TRƯỚC KHI ĐÓNG GÓI NỘP BÀI (PRE-ZIP SECURITY CHECKLIST)

- [x] **0 Khóa API thật & 0 Đường dẫn cá nhân:** Đã kiểm chứng tự động bằng `npm run scan:secrets`.
- [x] **File `.env` được loại trừ:** `.env` nằm trong `.gitignore` và bị loại bỏ hoàn toàn khi đóng gói ZIP.
- [x] **Tệp `.env.example` chuẩn:** Cung cấp sẵn `.env.example` với giá trị mẫu an toàn (`your_gemini_api_key_here`).
- [x] **88/88 Unit & Acceptance Tests vượt qua:** Chạy `npm test` đạt 100% PASS.
- [x] **0 Cảnh báo Linter:** Chạy `npm run lint` đạt `0 warnings, 0 errors`.
- [x] **Đóng gói & Giải nén kiểm chứng độc lập:** Gói nộp bài tạo bởi `npm run package:submission` loại bỏ hoàn toàn `node_modules`, `.git`, `dist`, `.env`.
