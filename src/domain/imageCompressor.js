/**
 * @file imageCompressor.js
 * Tiện ích nén và resize ảnh phía client bằng HTML Canvas để tiết kiệm quota localStorage
 * Giới hạn cạnh dài tối đa 1280px, chất lượng 0.8 JPEG/WebP.
 */

const MAX_EDGE = 1280;
const QUALITY = 0.8;
const MAX_INPUT_SIZE_MB = 5;

/**
 * Đọc file ảnh, kiểm tra tính hợp lệ và nén/resize qua Canvas
 * @param {File} file
 * @returns {Promise<{ dataUrl: string, width: number, height: number, sizeKB: number }>}
 */
export async function compressImage(file) {
  if (!file) {
    throw new Error('Chưa chọn file ảnh.');
  }

  // 1. Kiểm tra MIME type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Định dạng không hỗ trợ. Vui lòng tải file JPG, PNG hoặc WebP.');
  }

  // 2. Kiểm tra dung lượng gốc
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_INPUT_SIZE_MB) {
    throw new Error(`Dung lượng file (${sizeMB.toFixed(1)} MB) vượt quá giới hạn 5 MB. Vui lòng chọn ảnh nhỏ hơn.`);
  }

  // 3. Đọc qua FileReader
  const originalDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh. Vui lòng thử lại.'));
    reader.readAsDataURL(file);
  });

  // 4. Nạp vào HTML Image
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Tính tỷ lệ co giãn nếu vượt quá MAX_EDGE
      if (width > MAX_EDGE || height > MAX_EDGE) {
        if (width > height) {
          height = Math.round((height * MAX_EDGE) / width);
          width = MAX_EDGE;
        } else {
          width = Math.round((width * MAX_EDGE) / height);
          height = MAX_EDGE;
        }
      }

      // Vẽ vào Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Trình duyệt không hỗ trợ xử lý đồ họa Canvas.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Thử xuất WebP, fallback sang JPEG
      let outputMime = 'image/webp';
      let dataUrl = canvas.toDataURL(outputMime, QUALITY);
      if (!dataUrl.startsWith('data:image/webp')) {
        outputMime = 'image/jpeg';
        dataUrl = canvas.toDataURL(outputMime, QUALITY);
      }

      // Tính dung lượng base64 tương đương KB
      const sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);

      resolve({
        dataUrl,
        width,
        height,
        sizeKB,
      });
    };

    img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh vào Canvas.'));
    img.src = originalDataUrl;
  });
}

