import fs from 'fs';
import path from 'path';

/**
 * Serverless / Express API Handler để lưu nhật ký đánh giá module trực tiếp vào thư mục module_reports/
 * File tạo: module_reports/MODULE_DEV_REVIEW_LOG.md & module_reports/MODULE_DEV_REVIEW_LOG.json
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Phương thức không được hỗ trợ. Vui lòng dùng POST.' });
  }

  try {
    const { reviews = [], markdownContent = '', summary = {} } = req.body || {};

    const reportsDir = path.resolve(process.cwd(), 'module_reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const mdFilePath = path.join(reportsDir, 'MODULE_DEV_REVIEW_LOG.md');
    const jsonFilePath = path.join(reportsDir, 'MODULE_DEV_REVIEW_LOG.json');

    // Tạo nội dung Markdown mặc định nếu phía client không truyền
    let finalMarkdown = markdownContent;
    if (!finalMarkdown.trim()) {
      const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const acceptedCount = reviews.filter((r) => r.status === 'accepted').length;
      const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;
      const pendingCount = reviews.filter((r) => r.status === 'pending').length;

      finalMarkdown = `# NHẬT KÝ ĐÁNH GIÁ VÀ PHÊ DUYỆT MODULE (DEV MODE)
> **Dự án:** Event Landing Studio (ELS) — Vibecoding 2026, Đề số 08
> **Ngày ghi chép:** ${now}
> **Mục đích:** Ghi nhận đánh giá chấp nhận, loại bỏ và các ý kiến đóng góp của người dùng đối với từng module để AI Agent và đội ngũ phát triển tiếp tục cải tiến.

---

## 1. TỔNG QUAN KẾT QUẢ ĐÁNH GIÁ

| Chỉ số | Số lượng | Tỷ lệ (%) |
|---|:---:|:---:|
| **Tổng số module đã đánh giá** | **${reviews.length}** | 100% |
| **Đã chấp nhận (Approved)** | **${acceptedCount}** | ${reviews.length ? Math.round((acceptedCount / reviews.length) * 100) : 0}% |
| **Đã loại bỏ (Rejected)** | **${rejectedCount}** | ${reviews.length ? Math.round((rejectedCount / reviews.length) * 100) : 0}% |
| **Cần xem xét thêm (Pending)** | **${pendingCount}** | ${reviews.length ? Math.round((pendingCount / reviews.length) * 100) : 0}% |

---

## 2. CHI TIẾT ĐÁNH GIÁ TỪNG MODULE

${reviews.length === 0 ? '_Chưa có ghi chép đánh giá nào._' : reviews.map((item, idx) => `
### ${idx + 1}. [${item.status === 'accepted' ? 'CHẤP NHẬN ✓' : item.status === 'rejected' ? 'LOẠI BỎ ✗' : 'ĐANG XEM XÉT ⏳'}] ${item.moduleName || item.moduleType} (\`${item.moduleType}\`)
- **Biến thể (Variant):** \`${item.variant || 'default'}\`
- **Trạng thái:** **${item.status === 'accepted' ? 'Đã phê duyệt chấp nhận' : item.status === 'rejected' ? 'Đã yêu cầu loại bỏ' : 'Đang xem xét'}**
- **Thời gian đánh giá:** ${item.updatedAt || now}
- **Nhận xét & Góp ý cải tiến:**
> ${item.comment ? item.comment.replace(/\\n/g, '\\n> ') : '_Không có nhận xét thêm._'}
`).join('\n---\n')}

---

## 3. ĐỀ XUẤT HÀNH ĐỘNG DÀNH CHO AI AGENT
Dựa trên các module bị loại bỏ hoặc có nhận xét:
1. Đối với các module bị loại bỏ: Phân tích lý do và cải tiến bố cục, cỡ chữ, khoảng cách đệm hoặc ẩn khỏi preset mặc định.
2. Đối với các module được chấp nhận: Giữ nguyên cấu trúc slot và nhân rộng phong cách thiết kế sang các biến thể khác.
`;
    }

    // Ghi file Markdown và JSON
    fs.writeFileSync(mdFilePath, finalMarkdown, 'utf8');
    fs.writeFileSync(jsonFilePath, JSON.stringify({ summary, reviews, updatedAt: new Date().toISOString() }, null, 2), 'utf8');

    return res.status(200).json({
      ok: true,
      message: 'Đã lưu nhật ký đánh giá thành công!',
      mdFilePath: 'module_reports/MODULE_DEV_REVIEW_LOG.md',
      jsonFilePath: 'module_reports/MODULE_DEV_REVIEW_LOG.json',
      totalCount: reviews.length,
    });
  } catch (error) {
    console.error('Lỗi khi lưu review log:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}

