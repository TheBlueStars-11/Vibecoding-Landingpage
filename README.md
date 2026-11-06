# Event Landing Studio — Cuộc thi Vibe Coding 2026

## 1. Thông tin chung

| Hạng mục | Nội dung |
|---|---|
| **Đề bài bốc thăm** | **Đề số 08 — Tạo landing page sự kiện trong 5 phút** |
| **Tên sản phẩm** | **Event Landing Studio (ELS)** |
| **Bảng thi** | Bảng A - Công nghệ / Bảng B - Kinh tế |
| **Nền tảng** | Web App Responsive (Mobile-first) · Hash Routing · `localStorage` an toàn |
| **Kiểm thử tự động** | **25/25 unit tests** đạt chuẩn (`npm test`) |
| **Kiểm tra mã nguồn** | **0 cảnh báo, 0 lỗi** (`oxlint`) |
| **Kích thước bundle** | **~117 kB gzip** (tối ưu tải dưới 1 giây trên 3G/4G) |

> 📌 **Tuyên bố minh bạch AI theo quy chế cuộc thi**: Khi chạy từ mã nguồn không cấu hình khóa API hoặc khi gặp sự cố mạng, hệ thống tự động kích hoạt chế độ **"Bản demo vòng loại - Dữ liệu mô phỏng AI"** với nhãn minh bạch cố định trên giao diện, thanh sidebar và tài liệu. Khi có khóa API, toàn bộ yêu cầu được chuyển tiếp qua Serverless API Proxy `/api/generate` bảo mật, không để lộ khóa API phía client.

---

## 2. Kiến trúc ứng dụng & 2 Trang chính

Theo đúng tài liệu thiết kế chức năng (FDD `thiet-ke-chuc-nang-event-landing-studio.md`), hệ thống được tổ chức thành **2 trang quản trị** và **1 trang landing công khai đầu ra**:

```
Event Landing Studio
│
├── Trang 1: Trang mở đầu & Quản lý dự án        (#/)
│     ├── Khu chào hỏi theo thời gian UTC+7 & 3 bước tóm tắt
│     ├── Nút "Tạo dự án mới" → Dialog tạo dự án với tên & slug tự động
│     ├── Thống kê tổng hợp: Tổng dự án & Tổng lượt đăng ký
│     └── Danh sách dự án: Thẻ dự án, Lozenge trạng thái [Draft]/[Published], [Mở], [Sửa tên], [Xóa]
│
├── Trang 2: Không gian làm việc dự án           (#/p/:projectId/...)
│     ├── App bar cố định: Nút quay lại, tên dự án, trạng thái lưu nháp, nút Xuất bản/Gỡ xuất bản
│     ├── WS1 — Thông tin dự án + Thư viện ảnh nguồn     (#/p/:id/info)
│     ├── WS2 — Form đăng ký (Form Builder)              (#/p/:id/form)
│     ├── WS3 — AI Landing & Preview hai thiết bị        (#/p/:id/landing)
│     └── WS4 — Quản lý đơn đăng ký thời gian thực       (#/p/:id/registrations)
│
└── Trang landing công khai (Sản phẩm đầu ra)     (#/e/:slug)
      ├── Draft: Hiển thị thông báo "Sự kiện chưa mở đăng ký"
      └── Published: Đầy đủ 4 khu vực (Hero, Countdown UTC+7, Agenda, Form đăng ký)
```

---

## 3. Chi tiết 4 Không gian làm việc (Workspaces)

### WS1 — Thông tin dự án & Thư viện ảnh nguồn (`#/p/:id/info`)
- **7 trường thông tin bắt buộc**: Tên sự kiện (3–120 ký tự), Ngày diễn ra (chặn ngày quá khứ), Giờ bắt đầu (UTC+7), Địa điểm tổ chức, Diễn giả (≥ 1 người, có thêm/xóa/sửa), Ưu đãi đăng ký sớm (≤ 300 ký tự), Chương trình chi tiết (Agenda với tính năng sắp xếp mốc giờ).
- **Thư viện ảnh nguồn (Asset Library)**: Hỗ trợ upload tối đa 8 ảnh (JPG, PNG, WebP), tự động **resize cạnh dài ≤ 1280px** và nén qua HTML5 Canvas (~0.8 quality). Bắt buộc nhập **mô tả ảnh (caption)** và gán vai trò (`speaker`, `venue`, `gift`, `other`) để AI đặt ảnh đúng ngữ cảnh.
- **Tự động lưu nháp**: Debounce 800ms vào `localStorage` kèm nút lưu chính thức và tóm tắt lỗi trực quan.

### WS2 — Thông tin form điền (`#/p/:id/form`)
- **Trình thiết kế form động (Form Builder)**: Tùy biến tối đa 8 trường (`text`, `number`, `email`, `tel`), công tắc "Bắt buộc điền", văn bản gợi ý (hint).
- **Quy tắc chặt chẽ**: Đúng 1 trường `displayName` (Họ và tên) và ít nhất 1 trường `identity` (Email hoặc Số điện thoại) để chống đăng ký trùng lặp.
- **Bảo vệ quyền riêng tư**: Tự động phát hiện và cảnh báo khi người dùng thu thập thông tin nhạy cảm (CCCD, địa chỉ nhà, ngày sinh).
- **Bảo toàn dữ liệu cũ**: Áp dụng cơ chế soft delete khi gỡ trường, các đơn đăng ký đã thu thập trước đó không bị mất dữ liệu.
- **Xem trước trực tiếp (Live Preview)**: Xem giao diện form tương tác ngay bên cạnh trình soạn thảo.

### WS3 — AI Landing & Preview hai thiết bị (`#/p/:id/landing`)
- **Kiểm tra trước khi gọi (Pre-flight check)**: Kiểm tra tính sẵn sàng của toàn bộ dữ liệu WS1 và WS2, chỉ kích hoạt nút AI khi dữ liệu hợp lệ.
- **Biên soạn AI & Fact Guard**: Tự động tạo Headline, Đoạn mô tả và đúng 3 Lợi ích cốt lõi. Chặn AI bịa số liệu/URL, cho phép người dùng chỉnh sửa tay trước khi xuất bản.
- **Bộ chuyển đổi thiết bị (Responsive Device Frame)**:
  - **Laptop (1280px)**: Khung trình duyệt desktop mô phỏng tỷ lệ thực.
  - **Điện thoại (375px)**: Khung thiết bị di động có bo góc và notch giả lập, cuộn kéo mượt mà, không cuộn ngang.
- **Tương tác thử nghiệm**: Cho phép gửi đăng ký thử nghiệm trực tiếp ngay trong khung preview (`source: 'preview'`).
- **Xuất bản (Draft $\rightarrow$ Published)**: Cung cấp liên kết chia sẻ công khai kèm nút sao chép link 1-chạm.

### WS4 — Quản lý đơn đăng ký thời gian thực (`#/p/:id/registrations`)
- **Dashboard số liệu**: Thẻ số đơn đăng ký cập nhật tức thì (có hiệu ứng pulse và `aria-live`), thẻ đếm ngược thời gian còn lại đến sự kiện (UTC+7), thẻ số đơn hôm nay, thẻ đơn mới nhất.
- **Đồng bộ thời gian thực (Real-time Sync)**: Sử dụng kết hợp `BroadcastChannel('els-registrations')` và `storage event`, đơn đăng ký từ trang công khai hoặc tab khác sẽ xuất hiện ngay lập tức mà không cần F5.
- **Danh sách đơn**: Bảng Index table (desktop) / Thẻ danh sách (mobile) hiển thị mã đăng ký độc nhất (`DK-XXXXXX`), tên người đăng ký, thời gian bấm đăng.
- **Chi tiết đơn (Detail Panel)**: Bảng trượt bên phải (Side sheet trên desktop) hoặc Bottom sheet (trên mobile) hiển thị đầy đủ thông tin người tham dự đã điền, sao chép mã và xóa đơn.
- **Xuất CSV chuẩn Excel**: Xuất file CSV có **UTF-8 BOM (`\uFEFF`)** giúp Excel hiển thị tiếng Việt có dấu chuẩn xác 100%.

---

## 4. Mô hình dữ liệu & Lưu trữ LocalStorage

Hệ thống sử dụng tiền tố khóa `els:v1:*` để quản lý độc lập và hỗ trợ di trú (migration):

| Khóa LocalStorage | Nội dung | Mục đích |
|---|---|---|
| `els:v1:projects` | Mảng các đối tượng `Project` | Lưu metadata, cấu hình sự kiện, form fields và nội dung AI |
| `els:v1:assets:{projectId}` | Mảng các đối tượng `AssetImage` | Lưu riêng ảnh nguồn (đã nén base64) để tránh đầy quota |
| `els:v1:registrations:{projectId}` | Mảng các đối tượng `Registration` | Lưu toàn bộ đơn đăng ký của từng dự án |
| `els:v1:meta` | Metadata hệ thống | Phiên bản schema, id dự án mở gần nhất |

---

## 5. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu môi trường
- **Node.js**: v18+ (khuyến nghị v20 trở lên)
- **Trình duyệt**: Chrome, Firefox, Safari hoặc Edge phiên bản hiện đại

### Các bước khởi chạy
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển
npm run dev

# 3. Chạy toàn bộ 25 bài kiểm thử tự động
npm test

# 4. Kiểm tra chất lượng mã nguồn
npm run lint

# 5. Đóng gói bản chạy sản xuất
npm run build
```

---

## 6. Bảng kiểm thử chức năng (Test Cases)

| Mã | Tên kịch bản | Mô tả kiểm thử | Kết quả thực tế |
|---|---|---|---|
| **TC-01** | Tạo dự án mới | Nhập tên dự án $\rightarrow$ tạo thành công $\rightarrow$ vào WS1 | ✅ Đạt |
| **TC-02** | Validation WS1 | Để trống tên sự kiện / chọn ngày quá khứ $\rightarrow$ bị chặn | ✅ Đạt (báo lỗi tại trường) |
| **TC-03** | Nén ảnh Canvas | Upload ảnh 3MB $\rightarrow$ tự động resize $\le$1280px, nén còn dưới 200KB | ✅ Đạt |
| **TC-04** | Form Builder WS2 | Thêm trường mới, đổi loại sang Tel, gỡ trường cũ $\rightarrow$ giữ nguyên đơn cũ | ✅ Đạt (soft delete) |
| **TC-05** | Pre-flight & AI | Thiếu trường WS1 $\rightarrow$ nút AI bị khóa; đủ thông tin $\rightarrow$ sinh đủ Headline + 3 lợi ích | ✅ Đạt |
| **TC-06** | Xem trước thiết bị | Chuyển đổi qua lại giữa Laptop (1280px) và Điện thoại (375px) | ✅ Đạt (cuộn mượt, không lỗi CSS) |
| **TC-07** | Đăng ký & Chống trùng | Người dùng đăng ký trùng Email/SĐT $\rightarrow$ hệ thống từ chối ghi nhận | ✅ Đạt (chặn trùng lặp) |
| **TC-08** | Realtime WS4 | Mở WS4 ở tab 1, điền form ở tab 2 $\rightarrow$ tab 1 tăng bộ đếm và hiện đơn ngay | ✅ Đạt (BroadcastChannel) |
| **TC-09** | Xuất bản & Chặn Draft | Dự án ở trạng thái Draft $\rightarrow$ truy cập `#/e/:slug` báo "Chưa mở đăng ký" | ✅ Đạt |
| **TC-10** | Tải lịch (.ics) | Bấm "Thêm vào lịch" $\rightarrow$ tải file .ics chuẩn UTC+7 | ✅ Đạt |
| **TC-11** | Xuất CSV | Bấm "Xuất CSV" $\rightarrow$ file tải về mở đúng tiếng Việt trên Excel | ✅ Đạt (UTF-8 BOM) |
| **TC-12** | Bền vững sau F5 | Tải lại trang (F5) $\rightarrow$ toàn bộ dự án, ảnh, cấu hình form và đơn còn nguyên | ✅ Đạt |

---

## 7. Giới hạn & Giả định hiện tại

1. **Phạm vi lưu trữ**: Dữ liệu lưu trong `localStorage` gắn với trình duyệt của người dùng; việc xóa dữ liệu duyệt web sẽ làm mất các dự án đã tạo.
2. **Đồng bộ thời gian thực**: Tính năng realtime hoạt động giữa các tab trong cùng một trình duyệt; chưa đồng bộ qua mạng Internet giữa nhiều thiết bị độc lập.
3. **Landing page công khai**: Để chia sẻ link công khai cho người khác truy cập độc lập trên Internet, hệ thống hỗ trợ mô hình backend hoặc xuất landing page thành file HTML độc lập (hướng phát triển giai đoạn tiếp theo).

---
*Event Landing Studio — Đề số 08 Cuộc thi Vibe Coding 2026.*
