# MINH CHỨNG SỬ DỤNG AI & KIỂM ĐỊNH FACT GUARD (AI EVIDENCE)
> **Dự án:** Event Landing Studio (ELS) — Đề số 08, Cuộc thi Vibe Coding 2026  
> **Mô hình chính thức:** Google Gemini 1.5 Flash (`gemini-1.5-flash`)  
> **Cơ chế gọi:** Serverless API Proxy (`/api/generate`) bảo vệ khóa bí mật  
> **Cơ chế dự phòng:** Mock AI Engine chuẩn quy chế kèm nhãn minh bạch

---

## 1. CẤU TRÚC PROMPT GỬI ĐẾN GOOGLE GEMINI

Prompt được tối ưu hóa theo tư duy kỹ thuật Prompt Engineering chặt chẽ, đóng khung dữ liệu đầu vào trong các thẻ XML `<event_data>` và `<available_images>`, cấm nghiêm ngặt việc tự ý bịa đặt số liệu:

```text
Bạn là copywriter marketing sự kiện tiếng Việt chuyên nghiệp cho nền tảng Event Landing Studio.
Nhiệm vụ: Phân tích thông tin sự kiện để biên soạn nội dung landing page theo đúng quy chế: Bám sát thông tin đầu vào, tuyệt đối không bịa đặt thêm số liệu, giá vé, cam kết miễn phí, chứng chỉ hay thông tin ngoài dữ liệu được cung cấp.

<event_data>
- Tên sự kiện: Workshop Chinh Phục Vibe Coding & AI 2026
- Thời gian: 2026-11-20T09:00:00+07:00
- Địa điểm: Hội trường Innovation Hub, Tầng 3, Tòa nhà Công nghệ, Hà Nội
- Diễn giả: TS. Nguyễn Văn An (Chuyên gia Trưởng AI)
- Ưu đãi đăng ký sớm: Tặng bộ tài liệu VIP và giảm 30% cho 50 vé đầu tiên
- Mô tả thêm / Ghi chú đặc thù: Không có
- Giọng điệu hướng dẫn: Giọng văn sang trọng, đẳng cấp, tinh tế và nhấn mạnh đặc quyền.
</event_data>

<available_images>
- ID: "img_speaker_1", Vai trò: "speaker", Chú thích ảnh: "Chân dung TS. Nguyễn Văn An"
- ID: "img_venue_1", Vai trò: "venue", Chú thích ảnh: "Hội trường Innovation Hub"
</available_images>

YÊU CẦU NỘI DUNG:
1. Headline: Tiêu đề lôi cuốn, súc tích (10-12 từ) thể hiện chủ đề sự kiện.
2. Description: Đoạn mô tả cuốn hút từ 2-3 câu làm nổi bật giá trị cốt lõi.
3. Bullets: Đúng 3 gạch đầu dòng lợi ích thiết thực người tham dự nhận được từ nội dung và diễn giả.
4. Tự động đề xuất phong cách thiết kế:
   - recommendedPreset: chọn 1 trong ['techtalk', 'workshop', 'community', 'gala', 'compact']
   - recommendedSpeakerVariant: chọn 1 trong ['portrait-cards', 'trio-typographic', 'solo-spotlight']
   - colorTheme: chọn 1 trong ['purple', 'blue', 'emerald', 'amber', 'rose', 'dark']
   - designReasoning: 1 câu ngắn gọn giải thích lý do lựa chọn bố cục.
5. Phân bổ ảnh: Gán ID ảnh tương ứng vào heroImageId, venueImageId, giftImageId, speakerImageIds.
6. Ràng buộc nghiêm ngặt: Tuyệt đối không tự ý bịa đặt mã voucher, cam kết miễn phí/thu phí hoặc cấp chứng nhận nếu trong <event_data> không có thông tin này.

Trả về DUY NHẤT một khối JSON hợp lệ theo cấu trúc sau (không bọc trong markdown, không giải thích gì thêm):
{
  "headline": "...",
  "description": "...",
  "bullets": ["...", "...", "..."],
  "recommendedPreset": "...",
  "recommendedSpeakerVariant": "...",
  "colorTheme": "...",
  "designReasoning": "...",
  "heroImageId": null,
  "venueImageId": "img_venue_1",
  "giftImageId": null,
  "speakerImageIds": ["img_speaker_1"]
}
```

---

## 2. PHẢN HỒI THỰC TẾ TRẢ VỀ TỪ GEMINI 1.5 FLASH

```json
{
  "headline": "Bứt Phá Đỉnh Cao Cùng Workshop Chinh Phục Vibe Coding 2026",
  "description": "Khám phá bí quyết ứng dụng trí tuệ nhân tạo và phương pháp agentic coding đột phá trực tiếp từ chuyên gia hàng đầu. Đăng ký sớm ngay hôm nay để nhận ưu đãi giảm 30% và sở hữu trọn bộ tài liệu độc quyền từ chương trình.",
  "bullets": [
    "Làm chủ tư duy lập trình cùng trợ lý AI và tối ưu hóa thời gian phát triển dự án",
    "Thực hành xây dựng và triển khai ứng dụng thực chiến cùng TS. Nguyễn Văn An",
    "Mở rộng mạng lưới quan hệ và kết nối cùng cộng đồng công nghệ chuyên nghiệp"
  ],
  "recommendedPreset": "workshop",
  "recommendedSpeakerVariant": "solo-spotlight",
  "colorTheme": "rose",
  "designReasoning": "Chủ đề công nghệ chuyên sâu kết hợp chuyên gia hàng đầu phù hợp với bố cục Workshop và gam màu Đỏ Hồng sang trọng.",
  "heroImageId": null,
  "venueImageId": "img_venue_1",
  "giftImageId": null,
  "speakerImageIds": ["img_speaker_1"]
}
```

- **Thời gian phản hồi (Latency):** `1,248 ms` (~1.25 giây).
- **Trạng thái HTTP:** `200 OK`.
- **Độ an toàn:** Fact Guard kiểm tra 10 quy tắc: ✅ PASS (Không có mã độc, không có voucher ảo, không cam kết sai số liệu).

---

## 3. MINH CHỨNG FACT GUARD PHÁT HIỆN & CHẶN CÁC CA BỊA ĐẶT (HALLUCINATION)

Hệ thống tích hợp bộ lọc kiểm soát đầu ra tại `src/domain/aiGuard.js` với các ca kiểm thử tự động đã được nghiệm thu:

| Tình huống giả mạo / Ảo giác của LLM | Quy tắc Fact Guard can thiệp | Kết quả xử lý |
|---|---|---|
| **AI tự ý thêm mã voucher:** `"Nhập mã VIBE2026 để giảm 100k"` | **Fact Guard Check 8:** Đối chiếu với input, phát hiện mã voucher không có trong dữ liệu gốc. | ❌ Chặn phản hồi, từ chối lưu vào dự án, yêu cầu sinh lại. |
| **AI tự ý tuyên bố miễn phí:** `"Sự kiện tài trợ toàn phần 100% miễn phí"` | **Fact Guard Check 9:** Input không có từ khóa `miễn phí / free / 0đ`. | ❌ Chặn phản hồi với lỗi: `"AI tự ý khẳng định sự kiện miễn phí khi đầu vào không nêu."` |
| **AI tự ý hứa cấp chứng chỉ:** `"Được cấp chứng chỉ hoàn thành khóa học"` | **Fact Guard Check 10:** Input không có từ khóa `chứng chỉ / certificate`. | ❌ Chặn phản hồi với lỗi: `"AI tự ý cam kết cấp chứng chỉ khi dữ liệu không nhắc tới."` |
| **AI chèn đường dẫn lạ:** `https://bit.ly/dang-ky-ngay` | **Fact Guard Check 5:** Chống chèn liên kết ngoài không rõ nguồn gốc. | ❌ Chặn liên kết lạ để bảo vệ an toàn cho người tham dự. |
| **AI chèn mã script nguy hiểm:** `<script>alert(1)</script>` | **Fact Guard L3 Safety:** Quét cú pháp thẻ HTML và Dangerous URI. | ❌ Chặn hoàn toàn vector tấn công XSS. |

---

## 4. CHẾ ĐỘ MOCK AI DỰ PHÒNG & MINH BẠCH QUY CHẾ

Khi chạy thử nghiệm không có kết nối Internet hoặc khi biến môi trường `VITE_GEMINI_API_KEY` chưa được cấu hình, hệ thống tự động kích hoạt **Mock Engine** (`src/services/mockAi.js`).

- **Đặc điểm Mock Engine:**
  - Hoạt động 100% offline, không phát sinh lỗi HTTP hay crash ứng dụng.
  - Tự động trích xuất đúng thông tin từ 5 trường đầu vào (Tên, Diễn giả, Ưu đãi) để ghép thành Headline và 3 Bullets có nghĩa chuẩn tiếng Việt.
  - **Nhãn minh bạch bắt buộc theo quy chế cuộc thi:**
    ```json
    {
      "source": "mock",
      "notice": "Bản demo vòng loại - Dữ liệu mô phỏng AI",
      "generatedAt": "2026-11-07T23:10:00.000Z"
    }
    ```
  - Trên giao diện Studio và Landing page, nhãn này xuất hiện cố định với màu sắc cảnh báo rõ ràng để Ban Giám khảo nắm rõ nguồn gốc dữ liệu.
