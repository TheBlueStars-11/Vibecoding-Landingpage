# Event Landing Studio (ELS) — Vibecoding 2026

> 🌐 **BẢN TRIỂN KHAI TRỰC TUYẾN CHÍNH THỨC (LIVE DEMO HTTPS):**  
> 👉 [https://vibecoding-landingpage.vercel.app](https://vibecoding-landingpage.vercel.app)  
> *(Trải nghiệm tức thì không cần cài đặt — Tương thích mượt mà trên Desktop, Laptop, iPhone, iPad, Android)*

---

## 1. ĐỀ TÀI SỐ 08: TẠO LANDING PAGE SỰ KIỆN TRONG 5 PHÚT

- **Tên đề bài:** Đề số 08 — Hệ thống tạo Landing Page Sự kiện trong 5 phút ứng dụng AI Agentic Coding.
- **Tên sản phẩm:** **Event Landing Studio (ELS)**.
- **Cuộc thi:** Cuộc thi Vibe Coding 2026 — Bảng A (Công nghệ) & Bảng B (Kinh tế).
- **Mục tiêu sản phẩm:** Giải quyết bài toán tạo trang đích (landing page) sự kiện chuyên nghiệp với chi phí 0đ và thời gian dưới 5 phút cho nhà tổ chức sự kiện, câu lạc bộ, doanh nghiệp vừa và nhỏ (SME). Ứng dụng AI biên soạn nội dung chuẩn marketing, tự động phân bổ bố cục, cung cấp form đăng ký động chống spam, sinh mã vé kèm QR code check-in tức thì và thống kê thời gian thực.
- **Phạm vi hoàn thiện:** Web Application Responsive chuẩn Progressive Web App (PWA) ready, hoạt động bền vững độc lập 100% trên LocalStorage của trình duyệt (Offline-first) kết hợp Serverless Proxy và Cloudflare Tunnel chia sẻ đa thiết bị.

---

## 2. CÔNG NGHỆ SỬ DỤNG

| Lớp kiến trúc | Công nghệ / Thư viện | Vai trò & Mục đích kỹ thuật |
|---|---|---|
| **Frontend Framework** | **React 19.3 + Vite 8.3** | Xây dựng Single Page Application hiện đại với hiệu năng render vượt trội, Hot Module Replacement dưới 50ms. |
| **Giao diện & Thẩm mỹ** | **Vanilla CSS Modules + Luxury Rose-Red Palette** | Bảng màu Đỏ Hồng Cao Cấp (`#e11d48`, `#be123c`, `#9f1239`) kết hợp Dark Titanium Slate (`#09090b`), GPU-accelerated transition, 0 xung đột CSS toàn cục. |
| **Định tuyến & Trạng thái** | **Hash-based Routing (`useHashRoute`)** | Điều hướng không tải lại trang (`#/`, `#/p/:id/*`, `#/e/:slug`), hoạt động hoàn hảo trên mọi static hosting (Vercel, GitHub Pages, Localhost) mà không bị lỗi 404 Rewrite. |
| **AI Engine & Fact Guard** | **Google Gemini 1.5 Flash + Local Fact Guard L1 - L5** | Tích hợp AI tạo nội dung tiếng Việt có kiểm duyệt 10 tầng (chống XSS, chống bịa đặt voucher/giảm giá/diễn giả lạ/cam kết miễn phí/chứng chỉ). |
| **Mock Engine dự phòng** | **Deterministic Mock Content Generator** | Tự động kích hoạt khi offline hoặc không có API key, gắn nhãn minh bạch theo quy chế cuộc thi: *"Bản demo vòng loại - Dữ liệu mô phỏng AI"*. |
| **Serverless Backend** | **Vercel Serverless Functions (`api/*.js`)** | Giấu hoàn toàn khóa API phía máy chủ, giới hạn payload 16KB, che mờ URL tránh rò rỉ token. |
| **Mã QR & Check-in** | **qrcode + jsqr** | Sinh ảnh mã QR vé tham dự sắc nét (`DK-XXXXXX`), hỗ trợ máy quét camera quét vé trực tiếp trên điện thoại để check-in sự kiện. |
| **Kiểm tra chất lượng** | **Oxlint + Node.js Built-in Test Runner** | **0 cảnh báo, 0 lỗi** (`oxlint`), **82/82 bài kiểm thử tự động** chạy trong ~300ms. |

---

## 3. 5 TÍNH NĂNG CỐT LÕI (F1 → F5 THEO BAREM CHẤM ĐIỂM)

### 🌟 F1: Nhập liệu thông tin sự kiện & Thư viện ảnh nguồn
- Thu thập đầy đủ **5 trường thông tin bắt buộc**: Tên sự kiện, Ngày diễn ra, Giờ bắt đầu, Địa điểm tổ chức, Diễn giả (kèm danh xưng), Ưu đãi đăng ký sớm và Chương trình (Agenda).
- Kiểm tra tính hợp lệ tức thì: Chặn tên rỗng, chặn ngày giờ quá khứ, phân định rõ ngày đã qua vs giờ đã trôi qua hôm nay.
- **Thư viện ảnh nguồn (Asset Library)**: Hỗ trợ tải lên tối đa 8 ảnh (JPG, PNG, WebP), tự động nén HTML5 Canvas cạnh dài ≤ 1280px, gán vai trò (`speaker`, `venue`, `gift`, `other`) và chú thích ảnh bắt buộc.

### 🤖 F2: AI Copywriting thông minh & Fact Guard chống ảo giác
- AI phân tích dữ liệu 5 trường đầu vào để biên soạn đúng **3 thành phần cốt lõi**: Headline (10–12 từ lôi cuốn), Description (2–3 câu sâu sắc), và đúng 3 Bullets lợi ích thiết thực.
- **Fact Guard & Output Control 10 tầng bảo vệ**: Chặn mã độc XSS, chặn ký tự hỏng UTF-8, chặn chuỗi undefined/null, và đặc biệt **chống AI tự ý bịa đặt mã giảm giá (voucher), cam kết miễn phí 100% hoặc cam kết cấp chứng chỉ** khi dữ liệu đầu vào không nhắc tới.
- Cho phép người dùng chỉnh sửa tay nội dung trực quan trước khi xuất bản.

### 📱 F3: Xem trước tương tác Responsive 2 thiết bị
- Chuyển đổi mượt mà giữa 2 khung màn hình:
  - **Laptop Desktop (1280px)**: Bố cục dạng container rộng cao cấp, hiển thị đầy đủ hiệu ứng và menu điều hướng.
  - **Điện thoại Di động (375px)**: Khung máy iPhone có bo góc và viền notch, tối ưu giao diện 1 cột cuộn mượt mà, không vỡ layout (`overflow-x: hidden`).
- Đồng bộ giao diện tức thì theo bảng màu chủ đạo Đỏ Hồng Cao Cấp (Rose-Red Luxury) và các chủ đề mẫu (Tech Talk, Workshop, Gala VIP, v.v.).

### 🎫 F4: Form đăng ký động, Sinh mã vé DK-XXXXXX & Thống kê thời gian thực
- Form thu thập thông tin người tham dự với đúng 1 trường tên hiển thị và ít nhất 1 trường định danh (Email hoặc Số điện thoại).
- Đăng ký thành công tức thì:
  - Sinh mã vé độc nhất dạng **`DK-XXXXXX`** (loại bỏ ký tự dễ nhầm 0/O, 1/I).
  - Tự động tạo ảnh mã QR vé check-in chất lượng cao cho phép tải về điện thoại hoặc thêm sự kiện vào Google/Apple Calendar (.ics).
  - Số lượng người đăng ký tăng ngay tức thì **$N \rightarrow N+1$**, cập nhật đồng thời lên dashboard quản lý.
  - Chống đăng ký trùng lặp (trùng email hoặc số điện thoại).
  - **Bảo toàn dữ liệu sau F5**: 100% dữ liệu sự kiện và đơn đăng ký lưu trữ an toàn trong LocalStorage máy khách.

### 🔄 F5: Tạo trang mới (Reset sạch dự án an toàn)
- Nút "Tạo trang mới" trên thanh công cụ App Bar cho phép khởi tạo sự kiện mới nhanh chóng.
- **Hộp thoại xác nhận 2 bước an toàn (Modal Dialog)**: Hiển thị cảnh báo trực quan, yêu cầu xác nhận trước khi làm mới để chống thao tác bấm nhầm làm mất dữ liệu.
- Khi xác nhận: Reset sạch trạng thái dự án, đưa các trường về mặc định, sẵn sàng kiến tạo landing page tiếp theo trong tích tắc.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 4.1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.0 trở lên (khuyến nghị Node.js v20 hoặc v22 LTS).
- **Trình duyệt**: Google Chrome, Mozilla Firefox, Microsoft Edge hoặc Safari phiên bản mới nhất.

### 4.2. Khởi chạy nhanh bằng lệnh Terminal
```bash
# 1. Cài đặt các gói thư viện
npm install

# 2. Khởi chạy máy chủ phát triển (Dev Server)
npm run dev
# Mở trình duyệt truy cập: http://localhost:5173

# 3. Chạy toàn bộ 82 ca kiểm thử tự động
npm test

# 4. Kiểm tra chất lượng mã nguồn (Linter - 0 lỗi)
npm run lint

# 5. Rà soát bí mật và rò rỉ API key
npm run scan:secrets

# 6. Đóng gói bài thi tự động thành file .zip nghiệm thu
npm run package:submission

# 7. Biên dịch bản sản xuất (Production Build)
npm run build
```

---

### 4.3. BỘ DỮ LIỆU MẪU 5 TRƯỜNG BẮT BUỘC (DÀNH CHO GIÁM KHẢO KIỂM THỬ TRONG 30 GIÂY)

Giám khảo có thể sao chép nhanh dữ liệu chuẩn dưới đây và dán vào form để kiểm tra toàn bộ luồng F1 → F5:

| STT | Trường thông tin | Dữ liệu mẫu kiểm thử chuẩn (Copy & Paste) |
|:---:|---|---|
| **1** | **Tên sự kiện** | `Workshop Chinh Phục Vibe Coding & AI 2026` |
| **2** | **Ngày diễn ra** | `2026-11-20` *(hoặc chọn bất kỳ ngày nào trong tương lai)* |
| **3** | **Giờ bắt đầu** | `09:00` *(Giờ chuẩn Việt Nam GMT+7)* |
| **4** | **Địa điểm tổ chức** | `Hội trường Innovation Hub, Tầng 3, Tòa nhà Công nghệ, Hà Nội` |
| **5** | **Diễn giả chính** | `TS. Nguyễn Văn An (Chuyên gia Trưởng AI)` |
| **+** | **Ưu đãi đăng ký sớm** | `Tặng bộ tài liệu VIP và giảm 30% cho 50 vé đầu tiên` |

---

## 5. TUYÊN BỐ SỬ DỤNG AI (AI DECLARATION)

Nhằm đảm bảo tính minh bạch tuyệt đối theo quy chế Hội đồng Giám khảo Cuộc thi Vibe Coding 2026:

1. **Mô hình AI sử dụng:**
   - Ứng dụng tích hợp mô hình ngôn ngữ lớn **Google Gemini 1.5 Flash** (`gemini-1.5-flash`) thông qua API chính thức.
   - Toàn bộ lệnh gọi AI được định tuyến qua Serverless Proxy `/api/generate` (Node.js) trên server, **tuyệt đối không để lộ API key trong mã nguồn client bundle hay response trả về**.

2. **Chế độ Mock AI Engine dự phòng:**
   - Khi chạy kiểm thử offline, khi không cấu hình khóa `VITE_GEMINI_API_KEY`, hoặc khi gặp sự cố mạng (HTTP 500, 429), hệ thống tự động kích hoạt **Mock AI Engine** cục bộ.
   - Dữ liệu tạo ra bởi Mock Engine luôn gắn nhãn minh bạch cố định:  
     `"Bản demo vòng loại - Dữ liệu mô phỏng AI"`  
     được hiển thị rõ ràng trên giao diện, banner cảnh báo và tài liệu dự án để phân biệt với nội dung AI thật.

3. **Kiểm soát đầu ra (Fact Guard):**
   - 100% nội dung do AI sinh ra phải vượt qua bộ lọc Fact Guard L1 - L5 trước khi đến tay người dùng, đảm bảo không có mã script độc hại, không bịa đặt số liệu hay ưu đãi ngoài phạm vi dữ liệu đầu vào.

---

## 6. GIỚI HẠN SẢN PHẨM TRUNG THỰC (HONEST PRODUCT LIMITATIONS)

1. **Lưu trữ dữ liệu:**
   - Toàn bộ cấu hình sự kiện và danh sách đơn đăng ký được lưu trữ trong `localStorage` của trình duyệt người dùng. Nếu người dùng xóa dữ liệu duyệt web (Clear Browser Data/Cache), dữ liệu sự kiện cục bộ sẽ bị làm mới.
2. **Đồng bộ đa thiết bị:**
   - Cơ chế đồng bộ thời gian thực qua Server-Sent Events (SSE) và Cloudflare Tunnel là kênh hỗ trợ tốt nhất trong điều kiện có kết nối Internet hoặc cùng mạng Wi-Fi cục bộ. Trong trường hợp ngắt mạng hoàn toàn, hệ thống hoạt động độc lập 100% trên Localhost/máy cá nhân với LocalStorage là Single Source of Truth.
3. **Hạn ngạch API AI bên ngoài:**
   - Lệnh gọi AI trực tiếp phụ thuộc vào hạn ngạch (quota) của Google AI Studio. Khi chạm ngưỡng giới hạn tần suất (HTTP 429), hệ thống thông báo rõ ràng cho người dùng thử lại hoặc chuyển đổi linh hoạt.

---

## 7. NGUỒN THAM KHẢO & THƯ VIỆN BÊN THỨ BA

Tất cả các thư viện sử dụng trong dự án đều là mã nguồn mở với giấy phép thương mại tự do (MIT / Apache 2.0), không vi phạm bản quyền:

- **React & React DOM (v19.3.1)** — Giấy phép MIT — Meta Platforms, Inc.
- **Vite (v8.3.4)** — Giấy phép MIT — Yuxi (Evan) You & Đội ngũ Vite.
- **qrcode (v1.5.4)** — Giấy phép MIT — Thư viện sinh mã ma trận QR Code tiêu chuẩn.
- **jsqr (v1.4.0)** — Giấy phép Apache 2.0 — Thư viện nhận diện mã QR từ luồng video camera.
- **Oxlint (v1.88.0)** — Giấy phép MIT — Bộ phân tích cú pháp và chất lượng mã nguồn hiệu năng cao bằng Rust.
- **Canvas Confetti** — Thuật toán bắn pháo hoa giấy hiệu ứng ăn mừng đạt chuẩn UX.

---

## 8. CHECKLIST AN TOÀN TRƯỚC KHI ĐÓNG GÓI NỘP BÀI (PRE-ZIP SECURITY CHECKLIST)

Trước khi đóng gói file ZIP nộp bài cho Ban Tổ chức, hệ thống đã thực hiện tự động và nghiệm thu đạt 100% các tiêu chí sau:

- [x] **0 Khóa API thật:** Đã chạy script `npm run scan:secrets` quét toàn bộ dự án, không có khóa API nào bị hardcode.
- [x] **File `.env` được loại trừ:** File `.env` chứa khóa cá nhân nằm trong `.gitignore` và bị loại bỏ tự động khỏi file nén.
- [x] **Tệp `.env.example` chuẩn:** Cung cấp sẵn file `.env.example` với các giá trị mẫu dummy (`your_gemini_api_key_here`).
- [x] **82/82 Unit Tests vượt qua:** Chạy `npm test` thành công 100% không có lỗi.
- [x] **0 Cảnh báo Linter:** Chạy `npm run lint` đạt 0 warnings, 0 errors.
- [x] **Kích thước file ZIP tối ưu:** Đóng gói bằng `npm run package:submission` chỉ ~3.0 MB, loại bỏ hoàn toàn `node_modules`, `.git`, `dist`.
- [x] **Giải nén kiểm chứng:** Đã tự động giải nén và kiểm thử tính toàn vẹn (Zero Secret Verification) trước khi xuất file nộp bài.

---
*Event Landing Studio — Đề số 08 Cuộc thi Vibe Coding 2026.*  
*Phát triển với sự chính xác, bảo mật và thẩm mỹ cao cấp.*
