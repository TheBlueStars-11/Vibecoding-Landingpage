# Event Landing Studio — Cuộc thi Vibe Coding 2026

> Các mục dạng `<...>` là thông tin cần đội điền trước khi nộp bài.

## 1. Thông tin chung

| Hạng mục | Nội dung |
|---|---|
| Tên đội thi | `Đệ tử thầy Hoan` |
| Bảng thi | `Bảng A - Công nghệ` |
| Đề bài bốc thăm | Đề số `08` — `Tạo landing page sự kiện trong 5 phút` |
| Demo online | `https://landingpagesukien.vercel.app/` |
| Video demo (≤ 02 phút) | `https://drive.google.com/file/d/1ZH5tFGmjIeEjMi3-4_I3o0mm4yIbgPLh/view` |
| Source ZIP | `URL tải gói ở phần nộp bài` |
| Minh chứng dùng AI | `<Kèm trong Mục 10 của tài liệu này>` |
| Bảng kiểm thử | `<Kèm trong Mục 11 của tài liệu này>` |

> Tiêu chí vòng loại: https://vibecoding.info.vn/tieu-chi-cham-thi
> Bảng A: ít nhất 6 ca kiểm thử; chỉ dùng Mock thì nhóm A3 tối đa 4/15 điểm.
> Bảng B: ít nhất 3 ca kiểm thử; AI thật hoặc Mock minh bạch đều có thể đạt 100/100 theo chuẩn bảng B.
> Không đưa khóa API hoặc mật khẩu vào bài nộp.

## 2. Tính năng chính

- Nhập thông tin sự kiện (tên, thời gian, địa điểm, diễn giả, ưu đãi đăng ký sớm, lịch trình, ảnh minh hoạ).
- `AI phân tích dữ liệu và tự động sinh nội dung landing page (tiêu đề, mô tả, lợi ích, FAQ, bố cục, màu sắc)`
- `Xem trước landing page, tuỳ chỉnh module, xuất bản và chia sẻ qua QR code / link`
- `Khách truy cập landing page và đăng ký tham dự; nhận mã vé DK-XXXXXX tức thì`
- `Quản trị viên xem danh sách đăng ký, check-in bằng QR, xuất CSV và xoá bản ghi`

## 3. Công nghệ sử dụng

| Lớp | Công nghệ (ghi đúng thứ đã dùng) |
|---|---|
| Giao diện | `React 19` + `CSS Modules (không dùng Tailwind)` |
| Thư viện | `react@19.3.1, react-dom@19.3.1, qrcode@1.5.4, jsqr@1.4.0` |
| Lưu trữ | localStorage (phía trình duyệt, không có backend) |
| Triển khai | `Vercel` |

## 4. Tích hợp AI

- **Chế độ đang dùng**: `API thật` (chọn một)
  - API thật: `chib/gemini-3.8-flash` (qua endpoint tương thích OpenAI của vilao.ai)
  - Mock: giao diện hiển thị dòng *"Bản demo vòng loại - Dữ liệu mô phỏng AI"*
- **Mục đích**: phân tích dữ liệu người dùng nhập và trả về gợi ý theo ngữ cảnh đề bài.
- **Bảo mật khoá API**: không ghi khoá trong mã nguồn phía client. Đặt trong biến môi trường (`.env`, không commit) và gọi qua serverless function / proxy; nếu chỉ dùng Mock thì không cần khoá.

Biến môi trường (nếu dùng API thật):

```env
VITE_GEMINI_API_KEY=<khoá của bạn>
VITE_GEMINI_BASE_URL=https://api.vilao.ai/v1
VITE_GEMINI_MODEL=chib/gemini-3.8-flash
```

## 5. Cài đặt và chạy local

Yêu cầu: trình duyệt hiện đại; Node.js ≥ 18 nếu dùng React/Vue/Vite.

**Cách B — React/Vue (Vite)**

```bash
npm install
npm run dev      # chạy dev, mặc định http://localhost:5173
npm run build    # build production ra thư mục dist/
```

## 6. Cấu trúc thư mục

```text
vibecode/
├── index.html
├── package.json
├── vite.config.js
├── .env.example                        # mẫu biến môi trường
├── .gitignore
├── .oxlintrc.json
├── api/                                # serverless functions (Vercel)
│   ├── generate.js                     # proxy gọi AI API
│   ├── network-info.js                 # trả về IP LAN & trạng thái tunnel
│   ├── _lib/
│   │   └── http.js
│   ├── sync/                           # đồng bộ dữ liệu thời gian thực
│   │   ├── project.js
│   │   ├── publish.js
│   │   ├── register.js
│   │   ├── registrations.js
│   │   └── stream.js                   # Server-Sent Events
│   └── tunnel/                         # quản lý Cloudflare Tunnel
│       ├── start.js
│       ├── status.js
│       └── stop.js
├── public/                             # tài nguyên tĩnh
│   ├── favicon.svg
│   ├── icons.svg
│   └── sample-assets/                  # ảnh mẫu cho dự án demo
│       ├── event_poster.svg
│       ├── prizes_awards.svg
│       ├── speaker_1.jpg
│       ├── speaker_2.jpg
│       ├── speaker_3.jpg
│       └── venue_auditorium.svg
├── scripts/                            # tiện ích build & đóng gói
│   ├── package-submission.mjs          # đóng gói ZIP nộp bài
│   └── scan-secrets.mjs               # quét lộ API key trước khi commit
├── src/                                # mã nguồn React
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── App.module.css
│   ├── assets/
│   │   ├── hero.png
│   │   └── vite.svg
│   ├── components/
│   │   ├── welcome/                    # màn hình chào (WelcomeIntro)
│   │   ├── home/                       # dashboard quản lý dự án (HomeDashboard)
│   │   ├── studio/                     # studio biên tập landing page
│   │   │   ├── StudioLayout.jsx
│   │   │   ├── WorkspaceInfo.jsx       # nhập thông tin sự kiện & gọi AI
│   │   │   ├── WorkspaceForm.jsx       # thiết kế form đăng ký
│   │   │   ├── WorkspaceLanding.jsx    # xem trước & xuất bản
│   │   │   ├── WorkspaceRegistrations.jsx  # danh sách đăng ký & check-in
│   │   │   └── QrCheckInModal.jsx      # quét QR check-in
│   │   ├── landing/                    # render landing page (module-based)
│   │   │   ├── LandingView.jsx
│   │   │   └── ModuleRenderer.jsx
│   │   ├── public/                     # trang landing công khai (URL slug)
│   │   │   └── PublicLandingPage.jsx
│   │   └── ui/                         # UI primitives dùng chung
│   │       ├── ErrorBoundary.jsx
│   │       ├── Icons.jsx
│   │       ├── ConfirmDialog.jsx
│   │       ├── Toast.jsx
│   │       └── Lozenge.jsx
│   ├── domain/                         # logic nghiệp vụ thuần (không phụ thuộc React)
│   │   ├── elsSchema.js               # schema & factory (Project, Asset, Registration)
│   │   ├── validators.js              # validation đầu vào
│   │   ├── aiGuard.js                 # kiểm soát & xác thực đầu ra AI
│   │   ├── moduleSchema.js            # schema module landing page
│   │   ├── moduleAuditor.js           # kiểm tra cấu trúc module bắt buộc
│   │   ├── normalize.js               # chuẩn hóa text, email, phone
│   │   ├── time.js                    # countdown & xử lý thời gian GMT+7
│   │   ├── agenda.js                  # xử lý lịch trình sự kiện
│   │   ├── calendar.js                # tiện ích lịch
│   │   ├── errors.js                  # ElsError & mã lỗi chuẩn
│   │   ├── imageCompressor.js         # nén ảnh phía client
│   │   ├── sampleAssets.js            # dữ liệu ảnh mẫu
│   │   └── sampleProjects.js          # dự án mẫu cho demo
│   ├── services/                       # tầng tích hợp bên ngoài & localStorage
│   │   ├── aiClient.js                # gọi AI API (proxy + client-direct fallback)
│   │   ├── aiLogger.js                # nhật ký gọi AI, masking API key
│   │   ├── mockAi.js                  # Mock engine (dữ liệu mô phỏng AI)
│   │   ├── elsRepository.js           # CRUD localStorage (Project, Asset, Registration)
│   │   └── realtimeSync.js            # SSE client đồng bộ đăng ký thời gian thực
│   ├── router/
│   │   └── useHashRoute.js            # hash-based router (#welcome / #home / #studio / #public)
│   └── themes/
│       ├── tokens.css                 # CSS custom properties (màu, spacing, font)
│       └── themes.css                 # các bộ màu theme (purple, blue, emerald, ...)
└── tests/                              # bộ kiểm thử Node.js built-in test runner
    ├── acceptance.test.js              # TC-01→TC-06 + TX-01→TX-15 + SEC-01→SEC-09
    ├── domain.test.js                  # unit test domain logic
    ├── els.test.js                     # unit test elsRepository
    └── module.test.js                  # unit test moduleSchema & moduleAuditor
```

## 7. Truy cập và phân quyền

- Không yêu cầu đăng nhập; chuyển đổi giữa màn hình người dùng và màn hình quản trị ngay trên giao diện.
- Màn hình quản trị: xem và xoá danh sách bản ghi trong localStorage.

## 8. Giới hạn hiện tại

- Dữ liệu chỉ lưu trên trình duyệt hiện tại; xoá dữ liệu trình duyệt hoặc đổi thiết bị sẽ mất dữ liệu.
- Không có xác thực, nên màn hình quản trị không bảo mật.
- Tính năng AI ở mức demo phục vụ vòng loại (nếu dùng Mock, dữ liệu trả về không phải kết quả thật).

## 9. Nguồn tham khảo

- Google Fonts, Lucide Icons
- Bộ thông số dịch vụ mẫu do Ban tổ chức cung cấp


## 10. Minh chứng dùng AI để xây dựng sản phẩm

Tối đa 1 trang kèm tối đa 5 ảnh/đoạn hội thoại chọn lọc. Ghi mục tiêu → yêu cầu cho AI → vấn đề phát hiện khi thử → yêu cầu sửa → kết quả kiểm tra lại.

- `submission-docs/minh-chung-ai.pdf` — Tài liệu minh chứng tổng hợp quá trình dùng AI xây dựng sản phẩm
- `submission-docs/01-chong-dang-ky-trung.jpg` — Vòng thử: phát hiện lỗi đăng ký trùng → yêu cầu AI bổ sung logic kiểm tra identityKey → kiểm tra lại thấy chặn đúng
- `submission-docs/02-kiem-tra-logic-timeline.jpg` — Vòng thử: kiểm tra logic đếm ngược và xử lý thời gian quá khứ → yêu cầu AI sửa hàm calculateCountdown → kết quả countdown không âm số
- `submission-docs/03-toi-uu-mobile-thu-vien-anh.jpg` — Vòng thử: giao diện mobile bị vỡ layout ảnh → yêu cầu AI tối ưu CSS và tích hợp thư viện nén ảnh phía client → kiểm tra lại trên thiết bị di động

## 11. Bảng kiểm thử

Bảng A: ít nhất 6 ca, gồm 2 bình thường, 2 đầu vào không hợp lệ, 2 ca biên/sự cố. Bảng B: ít nhất 3 ca, gồm bình thường, nhập thiếu/sai và một ca biên. Chấp nhận kiểm tra thủ công; ghi kết quả thực tế.

| Mã ca | Loại ca | Dữ liệu và bước thử | Kỳ vọng | Kết quả thực tế | Đạt/Chưa đạt |
|---|---|---|---|---|---|
| TC01 | `Bình thường` | `Nhập 5 trường: Tên="Workshop Chinh Phục Vibe Coding 2026", Ngày=2026-11-20, Giờ=09:00, Địa điểm="Hội trường Innovation Hub, Tầng 3, Tòa nhà Công nghệ, Hà Nội", Diễn giả="TS. Nguyễn Văn An – Chuyên gia AI", Ưu đãi="Tặng bộ tài liệu VIP và giảm 30% cho 50 vé đầu tiên" → bấm Sinh nội dung AI → xem kết quả trên landing page preview` | `AI trả về đủ headline, description, 3 bullets; landing page render đủ 4 khu vực Hero/Countdown/Agenda/Form` | `AI sinh đúng headline "Workshop Chinh Phục Vibe Coding 2026"; description 3 câu bám sát dữ liệu nhập; đủ 3 bullets (diễn giả, lịch trình, ưu đãi 30%); Hero hiển thị ngày 2026-11-20, giờ 09:00–11:30, địa điểm đầy đủ; Countdown hiện 10d 22h 03m 35s; navbar có Chương trình / Diễn giả / Địa điểm` | `Đạt` |
| TC02 | `Bình thường` | `Mở landing page "Workshop Chinh Phục Vibe Coding 2026" đã xuất bản → kéo xuống form đăng ký → điền: Họ và tên="Trần Thị Mai", Email="mai.tran@example.com", SĐT="0988123456" → bấm Gửi đăng ký → ghi lại mã vé → F5 → vào Studio tab Danh sách đăng ký kiểm tra` | `Hiển thị mã vé DK-XXXXXX; số lượng đăng ký tăng N→N+1; sau F5 vẫn giữ nguyên` | `Hiển thị "Đăng ký thành công!" kèm mã vé DK-KVVHSC và mã QR check-in; dashboard Studio ghi nhận Tổng đơn=1, Ghi nhận hôm nay=1, Đơn mới nhất="Trần Thị Mai", Trạng thái=Trực tuyến; bảng danh sách hiện đúng mã DK-KVVHSC / mail / nguồn Landing Page / thời gian 11:07:09 09-11` | `Đạt` |
| TC03 | `Đầu vào không hợp lệ` | `Bấm "Tạo dự án mới" → modal hiện ra → thử lần lượt: (3A) để trống Tên dự án → bấm "Tạo và bắt đầu"; (3B) nhập toàn khoảng trắng "     "; (3C) nhập tên quá ngắn "AB" → bấm "Tạo và bắt đầu"` | `Chặn tại modal tạo dự án, hiển thị lỗi ngay tại trường tên, không cho vào trang nhập thông tin sự kiện` | `Cả 3 trường hợp bị chặn ngay tại modal; hiển thị lỗi "Tên dự án không được để trống. Vui lòng nhập tên từ 3 đến 120 ký tự."; không chuyển sang bước tiếp theo` | `Đạt` |
| TC04 | `Đầu vào không hợp lệ` | `(4A) Vào tab Thông tin sự kiện → sửa Ngày=2020-01-01, Giờ=08:00 → bấm Sinh nội dung AI; (4B) Mở landing page public → điền Họ tên="Nguyễn Văn B", Email="mai.tran@example.com" đã tồn tại, SĐT="0911222333" → bấm Gửi đăng ký` | `(4A) Chặn tại form, báo lỗi ngày đã qua; countdown không hiển thị số âm. (4B) Báo lỗi trùng email, không tạo bản ghi mới` | `(4A) Trường Ngày diễn ra hiển thị viền đỏ và lỗi "Ngày diễn ra đã qua. Vui lòng chọn một ngày từ hôm nay trở đi." — không cho tiếp tục; (4B) Trường Email hiển thị viền đỏ và lỗi "Email/Số điện thoại này đã được sử dụng để đăng ký sự kiện rồi." — không tạo bản ghi mới (kiểm tra trùng lặp hoạt động khi cùng thiết bị/trình duyệt)` | `Đạt` |
| TC05 | `Giá trị biên` | `Tạo dự án mới với tên chứa ký tự đặc biệt, HTML, emoji và chuỗi dài: "Hội thảo: \"Vibe Coding 2026\" & Trí tuệ Nhân tạo — 🚀 Bùng nổ công nghệ tương lai! <script>alert(1)</script>" → điền ngày=2026-12-01, địa điểm="Hà Nội", diễn giả="Diễn giả A", ưu đãi="Giảm 20%" → bấm Sinh nội dung AI` | `Dữ liệu được chuẩn hóa an toàn; AI Guard chặn thẻ <script> hoặc mã độc, hiện thông báo lỗi rõ ràng` | `AI Guard phát hiện và chặn: hiển thị lỗi "Không thể tạo nội dung bằng AI — Phát hiện vi phạm tính xác thực: Nội dung chứa thẻ HTML, mã script hoặc URI nguy hiểm"; cung cấp 2 lựa chọn "Thử lại" và "Dùng dữ liệu mô phỏng"; không crash, không thực thi script độc hại` | `Đạt` |
| TC06 | `Xử lý sự cố` | `Tắt Wi-Fi → bấm "Sinh nội dung AI" → chờ kết quả lỗi → bật lại mạng → bấm "Thử lại"` | `Báo lỗi mạng rõ ràng, giữ nguyên dữ liệu form; bấm Thử lại sau khi có mạng thì thành công` | `Hiển thị lỗi "Không thể tạo nội dung bằng AI — fetch failed. Vui lòng kiểm tra mạng và bấm Thử lại"; dữ liệu form giữ nguyên (badge "Đã đủ thông tin từ WS1 & WS2!"); cung cấp 2 lựa chọn "Thử lại" và "Dùng dữ liệu mô phỏng"; sau khi bật mạng bấm Thử lại → sinh nội dung thành công` | `Đạt` |

## 12. Hồ sơ bàn giao

- Source ZIP chứa mã nguồn và README này; chỉ kèm cấu hình mẫu.
- Video tối đa 2 phút thể hiện thao tác thực tế và đủ 5 tính năng.
- Minh chứng dùng AI và bảng kiểm thử nằm trong ZIP hoặc có liên kết riêng.
- Ghi rõ tài khoản/dữ liệu demo nếu có.
- Bản nộp trước hạn là căn cứ chấm; không sửa tính năng sau hạn nộp.
