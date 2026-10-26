# Event Page Builder — Cuộc thi Vibe Coding 2026

## 1. Thông tin chung

| Hạng mục | Nội dung |
|---|---|
| Tên đội thi | `<Tên đội>` |
| Bảng thi | `<Bảng A - Công nghệ \| Bảng B - Kinh tế>` (chọn một) |
| Đề bài bốc thăm | Đề số `<số>` — Tạo landing page sự kiện trong 5 phút |
| Demo online | `<URL nếu có>` |
| Video demo (≤ 02 phút) | `<URL>` |
| Source ZIP | `<URL tải gói mã nguồn ZIP>` |
| Minh chứng dùng AI | Xem mục 10 |
| Bảng kiểm thử | Xem mục 11 |

> Tiêu chí vòng loại: https://vibecoding.info.vn/tieu-chi-cham-thi
> Không đưa khóa API hoặc mật khẩu vào bài nộp.

---

## 2. Tính năng chính

- **Form nhập liệu sự kiện**: tên sự kiện, ngày giờ, địa điểm, diễn giả, ưu đãi đăng ký sớm, chương trình.
- **AI sinh nội dung**: tự động tạo headline hấp dẫn, đoạn mô tả và 03 bullet lợi ích khi tham dự.
- **Render landing page hoàn chỉnh**: hero, đếm ngược đến giờ G (tự hiện "Sự kiện đã diễn ra" nếu đã qua), chương trình (agenda), form đăng ký.
- **Lưu và hiển thị danh sách đăng ký**: form đăng ký lưu vào localStorage, số người đăng ký cập nhật thời gian thực trên trang.
- **Tạo trang mới**: nút reset để làm lại từ đầu với sự kiện khác; xem danh sách đăng ký dạng bảng và xuất CSV ngay trong app.

---

## 3. Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Giao diện | React 18 + Vite 8 |
| Styling | CSS Modules (không dùng framework CSS) |
| Lưu trữ | localStorage (phía trình duyệt, không có backend) |
| Triển khai | `<Vercel \| Netlify \| GitHub Pages>` |

**Thư viện chính:**

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| vite | ^8.3.5 | Build tool / dev server |
| @vitejs/plugin-react | ^4.x | JSX transform |

---

## 4. Tích hợp AI

- **Chế độ đang dùng**: API thật — model `chib/gemini-3.8-flash` qua endpoint OpenAI-compatible
- **Mục đích**: nhận thông tin sự kiện từ người dùng, trả về JSON gồm `headline`, `description` và `bullets[3]` phục vụ render landing page.
- **Bảo mật khoá API**: khoá không ghi trong mã nguồn, đặt trong biến môi trường `.env` (không commit). Gọi thẳng từ client qua HTTPS đến endpoint của nhà cung cấp.

**Biến môi trường:**

```env
VITE_GEMINI_API_KEY=<khoá của bạn>
VITE_GEMINI_BASE_URL=https://api.vilao.ai/v1
VITE_GEMINI_MODEL=chib/gemini-3.8-flash
```

**Logic tự nhận diện loại API** (trong [`src/lib/gemini.js`](src/lib/gemini.js)):
- Nếu `BASE_URL` chứa `/v1` và không phải `googleapis` → gọi theo format **OpenAI-compatible** (`/chat/completions`, `Authorization: Bearer ...`)
- Ngược lại → gọi theo format **Google Gemini API** gốc

---

## 5. Cài đặt và chạy local

**Yêu cầu:** Node.js ≥ 18, npm ≥ 9

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file biến môi trường
cp .env.example .env
# Mở .env và điền VITE_GEMINI_API_KEY

# 3. Chạy dev server
npm run dev        # http://localhost:5173

# 4. Build production
npm run build      # output ra thư mục dist/
```

---

## 6. Cấu trúc thư mục

```text
vibecode/
├── src/
│   ├── components/
│   │   ├── EventForm.jsx           # Form nhập thông tin sự kiện
│   │   ├── EventForm.module.css
│   │   ├── LandingPage.jsx         # Render landing page hoàn chỉnh
│   │   ├── LandingPage.module.css
│   │   ├── Countdown.jsx           # Đếm ngược thời gian thực
│   │   ├── Countdown.module.css
│   │   ├── RegistrationForm.jsx    # Form đăng ký + badge số người
│   │   ├── RegistrationForm.module.css
│   │   ├── RegistrationList.jsx    # Modal xem danh sách + xuất CSV
│   │   └── RegistrationList.module.css
│   ├── lib/
│   │   ├── gemini.js               # Gọi AI API (hỗ trợ Gemini & OpenAI-compat)
│   │   └── storage.js              # CRUD localStorage cho đăng ký
│   ├── App.jsx                     # Điều phối flow: form → loading → preview
│   ├── App.module.css
│   ├── main.jsx
│   └── index.css
├── .env.example                    # Mẫu biến môi trường
├── .gitignore
├── vite.config.js
├── package.json
└── README.md
```

---

## 7. Truy cập và phân quyền

- Không yêu cầu đăng nhập.
- **Người dùng thường**: nhập thông tin → xem landing page → đăng ký tham dự.
- **Xem quản trị**: nút "📋 Xem danh sách đăng ký" trong section đăng ký trên landing page — hiển thị bảng toàn bộ người đã đăng ký, hỗ trợ xuất CSV.

---

## 8. Giới hạn hiện tại

- Dữ liệu đăng ký chỉ lưu trên trình duyệt hiện tại; xóa cache hoặc đổi thiết bị sẽ mất dữ liệu.
- Không có xác thực, màn hình xem danh sách đăng ký không có bảo mật.
- API key đặt ở phía client (Vite env) — phù hợp cho demo/vòng loại, nên dùng proxy/serverless cho production.

---

## 9. Nguồn tham khảo

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) — framework chính
- [Google AI Studio](https://aistudio.google.com/) — lấy Gemini API key
- CSS Modules — scoped styling không cần thư viện ngoài

---

## 10. Minh chứng dùng AI để xây dựng sản phẩm

> Tối đa 1 trang, tối đa 5 ảnh/đoạn hội thoại chọn lọc.

**Vòng thử tiêu biểu:**

| Bước | Nội dung |
|---|---|
| Mục tiêu | Sinh nội dung marketing tự động từ thông tin sự kiện |
| Yêu cầu cho AI | Prompt yêu cầu trả về JSON gồm `headline`, `description`, `bullets[3]` bằng tiếng Việt |
| Vấn đề phát hiện | Model đôi khi bọc JSON trong markdown code block (` ```json `) khiến `JSON.parse` lỗi |
| Yêu cầu sửa | Thêm bước strip markdown trước khi parse: `raw.replace(/```json/gi, '').replace(/```/g, '').trim()` |
| Kết quả | Parse thành công, landing page render đúng nội dung AI sinh ra |

- `<Tên tệp minh chứng hoặc liên kết ảnh hội thoại>`

---

## 11. Bảng kiểm thử

| Mã ca | Loại ca | Dữ liệu và bước thử | Kỳ vọng | Kết quả thực tế | Đạt/Chưa đạt |
|---|---|---|---|---|---|
| TC01 | Bình thường | Nhập đủ 5 trường, bấm "Tạo Landing Page" | AI sinh nội dung, landing page hiển thị đúng | `<Điền sau khi thử>` | `<Điền>` |
| TC02 | Bình thường | Đăng ký tham dự với họ tên + email + SĐT hợp lệ | Lưu localStorage, số người tăng lên 1 | `<Điền sau khi thử>` | `<Điền>` |
| TC03 | Đầu vào không hợp lệ | Bỏ trống trường "Tên sự kiện", bấm tạo | Form báo lỗi validation, không gọi API | `<Điền sau khi thử>` | `<Điền>` |
| TC04 | Đầu vào không hợp lệ | Đăng ký với email đã tồn tại trong localStorage | Hiện thông báo "Email này đã đăng ký rồi!" | `<Điền sau khi thử>` | `<Điền>` |
| TC05 | Ca biên | Đặt ngày sự kiện là ngày đã qua (trong quá khứ) | Đếm ngược hiển thị "Sự kiện đã diễn ra" thay vì số âm | `<Điền sau khi thử>` | `<Điền>` |
| TC06 | Sự cố | Nhập API key sai hoặc để trống, bấm tạo | Hiện thông báo lỗi rõ ràng, không crash app | `<Điền sau khi thử>` | `<Điền>` |

---

## 12. Hồ sơ bàn giao

- Source ZIP chứa toàn bộ mã nguồn và README này; chỉ kèm `.env.example`, không kèm `.env` thật.
- Video tối đa 2 phút thể hiện đủ 5 tính năng: nhập form → AI tạo nội dung → xem landing page → đăng ký → xem danh sách.
- Minh chứng dùng AI và bảng kiểm thử nằm trong ZIP hoặc có liên kết riêng.
- Bản nộp trước hạn là căn cứ chấm; không sửa tính năng sau hạn nộp.
