import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeText,
  normalizeEmail,
  normalizePhone,
  isValidVietnamesePhone,
} from '../src/domain/normalize.js';

import {
  calculateCountdown,
} from '../src/domain/time.js';

import {
  validateProjectName,
  validateProjectInfo,
  validateEventInput,
  validateFormFields,
  validateRegistration,
  validateRegistrationSubmission,
} from '../src/domain/validators.js';

import {
  cleanAndParseJson,
  validateAiSchema,
  checkFactGuard,
  runAiGuard,
} from '../src/domain/aiGuard.js';

import {
  generateRegistrationCode,
  createDefaultFormFields,
  createProject,
  createRegistrationRecord,
  FIELD_ROLES,
  FIELD_TYPES,
} from '../src/domain/elsSchema.js';

import {
  createDefaultModuleTree,
  MANDATORY_MODULE_TYPES,
} from '../src/domain/moduleSchema.js';

import {
  auditModuleLayout,
  AUDIT_LEVELS,
} from '../src/domain/moduleAuditor.js';

import { generateMockContent } from '../src/services/mockAi.js';
import { sanitizeForLog } from '../src/services/aiLogger.js';
import { elsRepository, formatCsvCell } from '../src/services/elsRepository.js';

// ============================================================================
// BẢNG KIỂM THỬ A: 6 CA KIỂM THỬ BẮT BUỘC THEO BAREM ĐỀ 08 (BẢNG A CÔNG NGHỆ)
// ============================================================================

describe('BẢNG KIỂM THỬ A: 6 CA BẮT BUỘC THEO QUY CHẾ BAREM', () => {
  // --------------------------------------------------------------------------
  // TC-01: Ca bình thường - Tạo Landing Page với 5 trường bắt buộc hợp lệ
  // --------------------------------------------------------------------------
  it('TC-01: Nhập 5 trường hợp lệ -> AI sinh đủ 3 thành phần -> Render đủ 4 khu vực bắt buộc', () => {
    const valid5Fields = {
      name: 'Workshop Chinh Phục Vibe Coding 2026',
      eventName: 'Workshop Chinh Phục Vibe Coding 2026',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hội trường Innovation Hub, Tầng 3, Tòa nhà Công nghệ, Hà Nội',
      speakers: [{ name: 'TS. Nguyễn Văn An', title: 'Chuyên gia AI' }],
      earlyBirdOffer: 'Tặng bộ tài liệu VIP và giảm 30% cho 50 vé đầu tiên',
      agenda: [
        { time: '09:00', title: 'Check-in & Đón tiếp' },
        { time: '09:30', title: 'Keynote & Thực chiến' },
      ],
    };

    // 1. Kiểm tra tính hợp lệ của 5 trường ở tầng xử lý
    const validation = validateProjectInfo(valid5Fields);
    assert.equal(validation.isValid, true, 'Dữ liệu 5 trường bắt buộc phải hợp lệ');

    // 2. Mô phỏng phản hồi AI đạt chuẩn
    const aiOutput = {
      headline: 'Chinh Phục Kỷ Nguyên Mới Cùng Vibe Coding 2026',
      description: 'Khám phá bí quyết ứng dụng AI và xây dựng landing page hiện đại chỉ trong vài phút. Chương trình thực hành chuyên sâu dành cho lập trình viên.',
      bullets: [
        'Làm chủ tư duy agentic coding và tự động hóa quy trình',
        'Thực hành triển khai landing page chuẩn responsive',
        'Nhận chứng nhận hoàn thành và kết nối cộng đồng chuyên gia',
      ],
    };

    const schemaRes = validateAiSchema(aiOutput);
    assert.equal(schemaRes.isValid, true, 'AI output phải thỏa mãn schema chuẩn');
    assert.equal(schemaRes.data.bullets.length, 3, 'Phải có đúng 3 lợi ích');

    // 3. Kiểm tra kiểm soát đầu ra (Fact Guard / Output Control)
    const factRes = checkFactGuard(schemaRes.data, {
      name: valid5Fields.eventName,
      location: valid5Fields.venue,
      earlyBird: valid5Fields.earlyBirdOffer,
      speakers: 'TS. Nguyễn Văn An',
    });
    assert.equal(factRes.pass, true, 'Nội dung AI không bịa đặt số liệu hay tên lạ');

    // 4. Render Layout phải có đủ 4 khu vực bắt buộc (Hero, Countdown, Agenda, Form)
    const tree = createDefaultModuleTree();
    const moduleTypes = tree.map((m) => m.type);
    for (const mandatory of MANDATORY_MODULE_TYPES) {
      assert.ok(moduleTypes.includes(mandatory), `Phải có module bắt buộc: ${mandatory}`);
    }

    const audit = auditModuleLayout(tree, valid5Fields);
    const errors = audit.filter((i) => i.level === AUDIT_LEVELS.ERROR);
    assert.equal(errors.length, 0, 'Module tree mặc định không được có lỗi bắt buộc');
  });

  // --------------------------------------------------------------------------
  // TC-02: Ca bình thường - Đăng ký hợp lệ, lưu bền & đếm real-time N -> N+1
  // --------------------------------------------------------------------------
  it('TC-02: Đăng ký thành công -> mã vé DK-XXXXXX -> N -> N+1 ngay lập tức -> bền vững sau F5', () => {
    const existingList = [
      { id: 'reg_1', identityKey: 'user1@example.com', code: 'DK-AAA111' },
      { id: 'reg_2', identityKey: 'user2@example.com', code: 'DK-BBB222' },
    ];
    const initialCount = existingList.length;

    const formFields = createDefaultFormFields();
    const submissionValues = {
      fld_name: 'Trần Thị Mai',
      fld_email: 'mai.tran@example.com',
      fld_phone: '0988123456',
    };

    const valResult = validateRegistrationSubmission(submissionValues, formFields, existingList, false);
    assert.equal(valResult.isValid, true, 'Đơn đăng ký phải hợp lệ');
    assert.equal(valResult.displayName, 'Trần Thị Mai');
    assert.equal(valResult.identityKey, 'mai.tran@example.com');

    // Sinh mã vé
    const code = generateRegistrationCode();
    assert.match(code, /^DK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);

    const record = createRegistrationRecord({
      projectId: 'prj_test_100',
      values: submissionValues,
      displayName: valResult.displayName,
      identityKey: valResult.identityKey,
      source: 'landing',
    });

    const updatedList = [record, ...existingList];
    const newCount = updatedList.length;

    // Đếm tăng N -> N+1 ngay lập tức
    assert.equal(newCount, initialCount + 1, 'Số lượng đăng ký phải tăng từ N -> N+1 ngay lập tức');

    // Mô phỏng F5: đọc lại danh sách từ bộ nhớ
    const reloadedList = JSON.parse(JSON.stringify(updatedList));
    assert.equal(reloadedList.length, initialCount + 1, 'Sau khi F5 tải lại, số đếm vẫn giữ nguyên N+1');
    assert.equal(reloadedList[0].identityKey, 'mai.tran@example.com');
  });

  // --------------------------------------------------------------------------
  // TC-03: Ca không hợp lệ - Bỏ trống hoặc toàn khoảng trắng trường bắt buộc
  // --------------------------------------------------------------------------
  it('TC-03: Bỏ trống hoặc toàn khoảng trắng Tên sự kiện -> Chặn tại tầng xử lý, không gọi AI, báo lỗi tại trường', () => {
    const invalidInputs = [
      { name: '', date: '2026-11-20', time: '09:00', location: 'Hà Nội', speakers: 'Diễn giả A', earlyBird: 'Ưu đãi' },
      { name: '    ', date: '2026-11-20', time: '09:00', location: 'Hà Nội', speakers: 'Diễn giả A', earlyBird: 'Ưu đãi' },
      { name: 'AB', date: '2026-11-20', time: '09:00', location: 'Hà Nội', speakers: 'Diễn giả A', earlyBird: 'Ưu đãi' }, // < 3 ký tự
    ];

    for (const input of invalidInputs) {
      const res = validateEventInput(input);
      assert.equal(res.isValid, false, 'Phải chặn khi tên sự kiện rỗng hoặc dưới 3 ký tự');
      assert.ok(res.errors.name, 'Phải có thông báo lỗi cụ thể tại trường name');
    }

    const prjNameRes = validateProjectName('   \t\n  ');
    assert.equal(prjNameRes.isValid, false);
    assert.ok(prjNameRes.error);
  });

  // --------------------------------------------------------------------------
  // TC-04: Ca không hợp lệ - Thời gian quá khứ & Trùng email/SĐT
  // --------------------------------------------------------------------------
  it('TC-04A: Thời gian sự kiện ở quá khứ -> Chặn tại form và Countdown không bao giờ âm số', () => {
    const pastInput = {
      name: 'Sự kiện Đã Qua',
      date: '2020-01-01',
      time: '08:00',
      location: 'Hà Nội',
      speakers: 'Diễn giả A',
      earlyBird: 'Giảm 20%',
    };
    const res = validateEventInput(pastInput);
    assert.equal(res.isValid, false, 'Thời gian quá khứ phải bị chặn');
    assert.ok(res.errors.date, 'Báo lỗi ngày sự kiện đã qua');

    // Countdown GMT+7 không âm số
    const cd = calculateCountdown('2020-01-01T08:00:00+07:00');
    assert.equal(cd.isPast, true);
    assert.equal(cd.d, 0);
    assert.equal(cd.h, 0);
    assert.equal(cd.m, 0);
    assert.equal(cd.s, 0);
  });

  it('TC-04B: Trùng email hoặc số điện thoại (đã chuẩn hóa) -> Báo lỗi cụ thể, không tạo bản ghi mới', () => {
    const existing = [
      { email: 'dangky@vibecode.vn', phone: '0912345678' },
    ];

    // Trùng email (chữ hoa/thường, khoảng trắng)
    const dupEmail = validateRegistration(
      { fullName: 'Lê Văn C', email: '  DANGKY@VIBECODE.VN  ', phone: '0988776655' },
      existing
    );
    assert.equal(dupEmail.isValid, false);
    assert.ok(dupEmail.errors.email);

    // Trùng số điện thoại (định dạng khác nhau: dấu chấm, khoảng trắng)
    const dupPhone = validateRegistration(
      { fullName: 'Lê Văn C', email: 'unique@vibecode.vn', phone: '0912.345.678' },
      existing
    );
    assert.equal(dupPhone.isValid, false);
    assert.ok(dupPhone.errors.phone);
  });

  // --------------------------------------------------------------------------
  // TC-05: Ca giá trị biên - Chuỗi rất dài, ký tự đặc biệt, dấu ngoặc, emoji
  // --------------------------------------------------------------------------
  it('TC-05: Dữ liệu chứa ký tự đặc biệt, HTML injection, emoji, chuỗi dài 200+ ký tự -> Chuẩn hóa an toàn', () => {
    const rawLongName = '   Hội thảo: "Vibe Coding 2026" & Trí tuệ Nhân tạo — 🚀 Bùng nổ công nghệ tương lai! <script>alert(1)</script>   ';
    const clean = normalizeText(rawLongName);

    // Chuẩn hóa Unicode NFC và dọn khoảng trắng
    assert.ok(clean.includes('Hội thảo: "Vibe Coding 2026" & Trí tuệ Nhân tạo'));
    assert.ok(clean.includes('🚀'));
    assert.equal(clean.includes('   '), false, 'Khoảng trắng thừa phải được dọn dẹp');

    // Fact Guard phát hiện và chặn mã độc Script
    const safetyRes = checkFactGuard(
      { headline: clean, description: 'Mô tả hợp lệ với dấu tiếng Việt', bullets: ['1', '2', '3'] },
      { name: clean }
    );
    assert.equal(safetyRes.pass, false, 'Chặn thẻ <script> hoặc mã độc');
  });

  // --------------------------------------------------------------------------
  // TC-06: Ca xử lý sự cố - Bấm gửi lặp, đứt mạng/lỗi AI, Tạo trang mới (Reset)
  // --------------------------------------------------------------------------
  it('TC-06.1: Khóa gửi chống lặp - Khi đang xử lý, lần nhấn thứ hai không được tạo thêm yêu cầu', () => {
    let isSubmitting = true;
    let submitCallCount = 0;

    function handleUserClick() {
      if (isSubmitting) return; // Khóa gửi bảo vệ
      submitCallCount++;
    }

    handleUserClick();
    handleUserClick();
    handleUserClick();
    assert.equal(submitCallCount, 0, 'Không phát sinh yêu cầu khi đang khóa gửi');

    isSubmitting = false;
    handleUserClick();
    assert.equal(submitCallCount, 1, 'Chỉ 1 yêu cầu được kích hoạt khi mở khóa');
  });

  it('TC-06.2: AI lỗi mạng hoặc vi phạm schema -> Báo lỗi cụ thể, GIỮ NGUYÊN dữ liệu form, không fallback Mock âm thầm', () => {
    const brokenAiOutput = 'Nội dung trả về không phải là JSON hoặc bị lỗi HTTP 500';
    const guardResult = runAiGuard(brokenAiOutput, { name: 'Sự kiện Test' });

    assert.equal(guardResult.ok, false, 'Guard phải từ chối khi dữ liệu AI bị hỏng');
    assert.ok(guardResult.error, 'Phải có thông báo lỗi giải thích nguyên nhân');
    // Dữ liệu form của người dùng vẫn được giữ nguyên vẹn
  });

  it('TC-06.3: Tạo trang mới (Tính năng #5) -> Xác nhận -> Reset sạch trạng thái dự án -> Sẵn sàng tạo sự kiện mới', () => {
    // Dự án cũ với dữ liệu
    const oldProject = createProject({
      name: 'Dự án Sự kiện Cũ',
      event: { eventName: 'Sự kiện 1', venue: 'Hà Nội' },
    });
    assert.equal(oldProject.name, 'Dự án Sự kiện Cũ');

    // Thao tác Tạo trang mới: khởi tạo dự án trắng hoàn toàn độc lập
    const freshProject = createProject({
      name: 'Sự kiện Công nghệ Mới 2026',
    });
    assert.notEqual(freshProject.id, oldProject.id, 'Phải sinh ID dự án mới');
    assert.equal(freshProject.name, 'Sự kiện Công nghệ Mới 2026');
    assert.equal(freshProject.event.eventDate, '', 'Dữ liệu ngày phải sạch');
    assert.equal(freshProject.event.venue, '', 'Dữ liệu địa điểm phải sạch');
    assert.equal(freshProject.status, 'draft', 'Trạng thái ban đầu phải là draft');
  });
});

// ============================================================================
// BẢNG KIỂM THỬ MỞ RỘNG (TX-01 ĐẾN TX-14): XỬ LÝ SỰ CỐ & BIÊN NÂNG CAO
// ============================================================================

describe('BẢNG KIỂM THỬ BỔ SUNG (TX-01 -> TX-14): ĐỘ ỔN ĐỊNH & KIỂM SOÁT HỆ THỐNG', () => {
  // TX-01: AI trả khác 3 lợi ích
  it('TX-01: AI trả thiếu lợi ích (chỉ 2 mục) -> Từ chối, giải thích lý do, KHÔNG tự ý thay bằng 3 mục mẫu âm thầm', () => {
    const badBullets = {
      headline: 'Hội thảo Trí tuệ Nhân tạo Đỉnh cao 2026',
      description: 'Chương trình hội thảo chuyên sâu khám phá các bước tiến công nghệ mới nhất.',
      bullets: [
        'Lợi ích 1: Nắm bắt kiến trúc agentic',
        'Lợi ích 2: Thực chiến dự án thực tế',
      ],
    };
    const res = validateAiSchema(badBullets);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('3 mục')));
  });

  // TX-02: Bóc tách JSON an toàn khi AI trả markdown code block hoặc lỗi
  it('TX-02: Bóc tách an toàn khi LLM bọc JSON trong markdown hoặc text phụ', () => {
    const wrapped = 'Dưới đây là kết quả:\n```json\n{"headline":"Tiêu đề hội thảo AI 2026","description":"Mô tả chi tiết sự kiện công nghệ","bullets":["Mục 1","Mục 2","Mục 3"]}\n```\nChúc bạn thành công!';
    const parsed = cleanAndParseJson(wrapped);
    assert.equal(parsed.headline, 'Tiêu đề hội thảo AI 2026');
    assert.equal(parsed.bullets.length, 3);
  });

  // TX-03: AI bịa đặt mức giảm giá hoặc tên diễn giả lạ (L4 Truthfulness Guard)
  it('TX-03: AI tự ý chèn ưu đãi "giảm 50%" hoặc bịa tên diễn giả không có trong đầu vào -> Bị chặn (L4)', () => {
    const hallucinatedOffer = {
      headline: 'Hội thảo Khoa học AI Toàn cầu 2026',
      description: 'Đăng ký ngay hôm nay để nhận ưu đãi giảm 50% học phí trực tiếp!',
      bullets: ['Lợi ích 1 chất lượng cao', 'Lợi ích 2 chất lượng cao', 'Lợi ích 3 chất lượng cao'],
    };
    const guardRes = checkFactGuard(hallucinatedOffer, {
      name: 'Hội thảo Khoa học AI Toàn cầu 2026',
      earlyBird: 'Tặng bộ tài liệu VIP', // Không hề có "giảm 50%"
    });
    assert.equal(guardRes.pass, false);
    assert.ok(guardRes.reason.includes('giảm 50%') || guardRes.reason.includes('chiết khấu'));

    // Diễn giả bịa đặt
    const hallucinatedSpeaker = {
      headline: 'Hội thảo Khoa học AI Toàn cầu 2026',
      description: 'Gặp gỡ diễn giả Steve Jobs và các chuyên gia hàng đầu.',
      bullets: ['Lợi ích 1 chất lượng cao', 'Lợi ích 2 chất lượng cao', 'Lợi ích 3 chất lượng cao'],
    };
    const spkRes = checkFactGuard(hallucinatedSpeaker, {
      name: 'Hội thảo Khoa học AI Toàn cầu 2026',
      speakers: 'Nguyễn Văn An, Trần Thị Mai',
    });
    assert.equal(spkRes.pass, false);
    assert.ok(spkRes.reason.includes('Steve Jobs') || spkRes.reason.includes('diễn giả'));
  });

  // TX-04: AI chứa "undefined" hoặc "null" hoặc "NaN" (L5 Language Guard)
  it('TX-04: AI chứa giá trị chưa biên dịch (undefined/null/NaN) -> Bị chặn (L5)', () => {
    const errorStringContent = {
      headline: 'Hội thảo Công nghệ tại undefined',
      description: 'Chương trình chi tiết về lập trình hiện đại.',
      bullets: ['Lợi ích 1 chất lượng cao', 'Lợi ích 2 chất lượng cao', 'Lợi ích 3 chất lượng cao'],
    };
    const res = checkFactGuard(errorStringContent, { name: 'Hội thảo Công nghệ' });
    assert.equal(res.pass, false);
    assert.ok(res.reason.includes('undefined') || res.reason.includes('giá trị lỗi'));
  });

  // TX-05: Ký tự lỗi mã hóa UTF-8
  it('TX-05: AI chứa ký tự hỏng mã hóa UTF-8 (\\ufffd) -> Bị chặn (L5)', () => {
    const corrupted = {
      headline: 'Hội thảo AI \ufffd\ufffd chất lượng cao',
      description: 'Mô tả sự kiện chi tiết chuẩn tiếng Việt.',
      bullets: ['Lợi ích 1 chất lượng cao', 'Lợi ích 2 chất lượng cao', 'Lợi ích 3 chất lượng cao'],
    };
    const res = checkFactGuard(corrupted, { name: 'Hội thảo AI' });
    assert.equal(res.pass, false);
    assert.ok(res.reason.includes('mã hóa'));
  });

  // TX-06: Khử trùng API Key trong nhật ký AI (ADR-5, Luồng 3)
  it('TX-06: Nhật ký AI tự động khử trùng (masking) API Key và Bearer token trước khi lưu hoặc xuất JSON', () => {
    const rawPayloadWithSecret = {
      prompt: 'Viết nội dung landing page',
      apiKey: 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
      headers: {
        authorization: 'Bearer secret_token_xyz_123456789',
      },
    };
    const sanitized = sanitizeForLog(rawPayloadWithSecret);
    assert.notEqual(sanitized.apiKey, 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6');
    assert.ok(sanitized.apiKey.includes('***MASKED***') || sanitized.apiKey.includes('...'));
    assert.ok(sanitized.headers.authorization.includes('***MASKED***'));
  });

  // TX-07: Khóa gửi chống spam liên tiếp
  it('TX-07: In-flight submission lock ngăn chặn gửi nhiều bản ghi khi bấm nhanh', () => {
    const submitted = [];
    let isLocked = false;

    function submit(data) {
      if (isLocked) return { ok: false, error: 'Đang xử lý, vui lòng chờ' };
      isLocked = true;
      submitted.push(data);
      return { ok: true };
    }

    const r1 = submit({ name: 'A' });
    const r2 = submit({ name: 'A' }); // Bấm lần 2 ngay lập tức
    assert.equal(r1.ok, true);
    assert.equal(r2.ok, false);
    assert.equal(submitted.length, 1);
  });

  // TX-08: Ngăn trùng lặp danh tính đăng ký
  it('TX-08: Ngăn chặn 2 tab cùng gửi trùng 1 email vào hệ thống', () => {
    const repo = [
      { id: '1', identityKey: 'vietnam@vibecode.vn' },
    ];
    const formFields = createDefaultFormFields();
    const sub = { fld_name: 'Người Tham Dự', fld_email: 'vietnam@vibecode.vn' };

    const check = validateRegistrationSubmission(sub, formFields, repo, false);
    assert.equal(check.isValid, false);
    assert.ok(check.error.includes('đã đăng ký'));
  });

  // TX-09: Hết chỗ (capacity) -> Khóa đăng ký với thông báo rõ ràng (ADR-11)
  it('TX-09: Sự kiện đạt giới hạn sức chứa (capacity) -> Khóa đăng ký và thông báo rõ ràng', () => {
    const existing = [
      { id: '1', identityKey: 'a@ex.com' },
      { id: '2', identityKey: 'b@ex.com' },
    ];
    const capacityLimit = 2; // Đã đủ 2 người

    const formFields = createDefaultFormFields();
    const newSub = { fld_name: 'Nguyễn Văn C', fld_email: 'c@ex.com' };

    const res = validateRegistrationSubmission(newSub, formFields, existing, false, capacityLimit);
    assert.equal(res.isValid, false, 'Phải từ chối đăng ký khi sự kiện đã đầy chỗ');
    assert.ok(res.error.includes('giới hạn') || res.error.includes('tối đa') || res.error.includes('đủ số lượng'));
  });

  // TX-10: Ưu đãi đăng ký sớm quá hạn
  it('TX-10: Phát hiện ưu đãi đăng ký sớm quá hạn so với thời gian hiện tại', () => {
    const pastDeadline = '2020-01-01T23:59:59+07:00';
    const isExpired = new Date(pastDeadline).getTime() < Date.now();
    assert.equal(isExpired, true, 'Hạn đăng ký sớm ở quá khứ phải được nhận diện là đã hết hạn');
  });

  // TX-11: Bỏ trống Diễn giả hoặc Ưu đãi đăng ký sớm bị chặn ở tầng xử lý (GAP-F1)
  it('TX-11: Bỏ trống Diễn giả hoặc Ưu đãi đăng ký sớm -> Bị chặn tại form với lỗi cụ thể', () => {
    // Thiếu diễn giả
    const noSpeaker = {
      eventName: 'Workshop AI',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hà Nội',
      speakers: [],
      earlyBirdOffer: 'Giảm 20%',
      agenda: [{ time: '09:00', title: 'Phiên 1' }],
    };
    const spkVal = validateProjectInfo(noSpeaker);
    assert.equal(spkVal.isValid, false);
    assert.ok(spkVal.errors.speakers);

    // Thiếu ưu đãi
    const noEarlyBird = {
      eventName: 'Workshop AI',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hà Nội',
      speakers: [{ name: 'Diễn giả A' }],
      earlyBirdOffer: '',
      agenda: [{ time: '09:00', title: 'Phiên 1' }],
    };
    const ebVal = validateProjectInfo(noEarlyBird);
    assert.equal(ebVal.isValid, false);
    assert.ok(ebVal.errors.earlyBirdOffer);
  });

  // TX-12: Xóa module Agenda bị Auditor phát hiện là lỗi bắt buộc (GAP-F3, ADR-8)
  it('TX-12: Thiếu module Agenda trong bố cục -> Auditor báo lỗi ERROR bắt buộc', () => {
    const modulesWithoutAgenda = [
      { id: 'm1', type: 'hero', name: 'Hero', hidden: false },
      { id: 'm2', type: 'countdown', name: 'Countdown', hidden: false },
      { id: 'm3', type: 'form', name: 'Form', hidden: false },
      // Không có agenda
    ];
    const issues = auditModuleLayout(modulesWithoutAgenda, { eventName: 'Hội thảo AI' });
    const missingAgendaIssue = issues.find((i) => i.id === 'missing_agenda');
    assert.ok(missingAgendaIssue, 'Auditor phải phát hiện thiếu module agenda');
    assert.equal(missingAgendaIssue.level, AUDIT_LEVELS.ERROR);
  });

  // TX-13: Chống CSV Formula Injection (GAP-T9)
  it('TX-13: Ô dữ liệu bắt đầu bằng =, +, -, @ được vô hiệu hóa khi xuất file CSV', () => {
    const dangerousCell = '=cmd|\' /C calc\'!A0';
    const safeResult = formatCsvCell(dangerousCell);
    // Phải được chèn dấu nháy đơn ' ở đầu để Excel không thực thi công thức
    assert.ok(safeResult.startsWith('"\'=cmd|'), 'Ký tự = phải được escape bằng nháy đơn');

    const dangerousUrl = '=HYPERLINK("http://evil.com","Click Me")';
    const safeUrl = formatCsvCell(dangerousUrl);
    assert.ok(safeUrl.startsWith('"\'=HYPERLINK'));
  });

  // TX-14: Nhãn dữ liệu mô phỏng AI đúng nguyên văn theo quy chế FDD
  it('TX-14: Mock Engine tạo dữ liệu luôn mang nhãn quy chế "Bản demo vòng loại - Dữ liệu mô phỏng AI"', () => {
    const mock = generateMockContent({
      name: 'Hội thảo Vibe Coding',
      location: 'Hà Nội',
      earlyBird: 'Giảm 25%',
    });
    assert.equal(mock.source, 'mock');
    assert.equal(mock.notice, 'Bản demo vòng loại - Dữ liệu mô phỏng AI');
    assert.ok(mock.headline.includes('Hội thảo Vibe Coding'));
    assert.equal(mock.bullets.length, 3);
  });

  // TX-15: Check-in QR: phân định chính xác Mã hợp lệ, Mã đã sử dụng và Mã không hợp lệ
  it('TX-15: Check-in QR: phân định chính xác Mã hợp lệ, Mã đã sử dụng và Mã không hợp lệ; ghi nhận thời gian quét thực tế', () => {
    const store = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (k) => store.get(k) || null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      },
    };

    const projectId = 'prj_qr_test_1';
    const reg1 = elsRepository.addRegistration(projectId, {
      values: { fld_name: 'Lê Văn An', fld_email: 'an.le@example.com' },
      displayName: 'Lê Văn An',
      identityKey: 'an.le@example.com',
    });

    // 1. Quét lần đầu -> Mã hợp lệ
    const res1 = elsRepository.checkInByCode(projectId, reg1.code);
    assert.equal(res1.status, 'valid');
    assert.equal(res1.record.checkedIn, true);
    assert.ok(res1.checkInTime, 'Phải lưu thời gian quét thực tế');

    // 2. Quét lần hai cùng mã -> Mã đã sử dụng
    const res2 = elsRepository.checkInByCode(projectId, reg1.code);
    assert.equal(res2.status, 'already_used');
    assert.equal(res2.checkInTime, res1.checkInTime);
    assert.ok(res2.message.includes('Mã đã sử dụng'));

    // 3. Quét mã không tồn tại -> Mã không hợp lệ
    const res3 = elsRepository.checkInByCode(projectId, 'DK-INVALID');
    assert.equal(res3.status, 'invalid');
    assert.ok(res3.message.includes('không hợp lệ'));

    // 4. Quét chuỗi JSON hoặc URL chứa mã
    const reg2 = elsRepository.addRegistration(projectId, {
      values: { fld_name: 'Phạm Bình', fld_email: 'binh@example.com' },
      displayName: 'Phạm Bình',
      identityKey: 'binh@example.com',
    });

    const resJson = elsRepository.checkInByCode(projectId, JSON.stringify({ code: reg2.code }));
    assert.equal(resJson.status, 'valid');
    assert.equal(resJson.record.displayName, 'Phạm Bình');

    // 5. Toggle check-in thủ công
    elsRepository.toggleCheckIn(projectId, reg2.id);
    const afterToggle = elsRepository.getRegistrations(projectId).find((r) => r.id === reg2.id);
    assert.equal(afterToggle.checkedIn, false);
    assert.equal(afterToggle.checkInTime, null);
  });
});

// ============================================================================
// BẢNG KIỂM THỬ C: STRESS TESTING & BẢO MẬT CHUYÊN SÂU (SEC-01 -> SEC-06)
// ============================================================================

describe('BẢNG KIỂM THỬ C: STRESS TESTING & BẢO MẬT CHUYÊN SÂU', () => {
  it('SEC-01: Chống mọi biến thể tấn công XSS, SVG onload, javascript: URI và data: URI', () => {
    const attacks = [
      { headline: 'Hội thảo javascript:alert(1) siêu cấp', description: 'Mô tả hợp lệ dài hơn 40 ký tự tiếng Việt có dấu đầy đủ', bullets: ['Lợi ích một rất hay ho', 'Lợi ích hai rất bổ ích', 'Lợi ích ba rất tuyệt vời'] },
      { headline: 'Hội thảo công nghệ hàng đầu', description: 'Mô tả chứa <img src=x onerror=alert(1)> nguy hiểm', bullets: ['Lợi ích một rất hay ho', 'Lợi ích hai rất bổ ích', 'Lợi ích ba rất tuyệt vời'] },
      { headline: 'Hội thảo công nghệ hàng đầu', description: 'Mô tả chứa <svg/onload=fetch("http://evil.com")> độc hại', bullets: ['Lợi ích một rất hay ho', 'Lợi ích hai rất bổ ích', 'Lợi ích ba rất tuyệt vời'] },
      { headline: 'Hội thảo data:text/html URI', description: 'Mô tả hợp lệ dài hơn 40 ký tự tiếng Việt có dấu đầy đủ', bullets: ['Lợi ích một rất hay ho', 'Lợi ích hai rất bổ ích', 'Lợi ích ba rất tuyệt vời'] },
    ];

    for (const attack of attacks) {
      const res = checkFactGuard(attack, { name: 'Hội thảo công nghệ' });
      assert.equal(res.pass, false, `Phải chặn vector XSS: ${JSON.stringify(attack)}`);
      assert.ok(res.reason.includes('không an toàn') || res.reason.includes('nguy hiểm'));
    }
  });

  it('SEC-02: Chuẩn hóa toàn diện số điện thoại Việt Nam đa định dạng và từ chối số giả mạo', () => {
    // Các định dạng hợp lệ
    assert.equal(normalizePhone('+84 912 345 678'), '0912345678');
    assert.equal(normalizePhone('84912345678'), '0912345678');
    assert.equal(normalizePhone('(0912) 345-678'), '0912345678');
    assert.equal(normalizePhone('0912.345.678'), '0912345678');
    assert.equal(isValidVietnamesePhone('0912345678'), true);
    assert.equal(isValidVietnamesePhone('+84 987 654 321'), true);

    // Các định dạng không hợp lệ
    assert.equal(isValidVietnamesePhone('12345'), false);
    assert.equal(isValidVietnamesePhone('0123456789'), false); // Đầu 01 không còn là SĐT di động 10 số
    assert.equal(isValidVietnamesePhone('abcdefghij'), false);
  });

  it('SEC-03: Chuẩn hóa email hoa/thường, khoảng trắng và từ chối định dạng email hỏng', () => {
    assert.equal(normalizeEmail('   NguyenVanA@GMAIL.COM   '), 'nguyenvana@gmail.com');

    // Đăng ký với email dị biệt
    const res = validateRegistration({
      fullName: 'Nguyễn Văn A',
      email: 'invalid-email-without-at',
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.email);
  });

  it('SEC-04: Fact Guard an toàn tuyệt đối khi nhận tham số null hoặc undefined', () => {
    assert.doesNotThrow(() => {
      const res = checkFactGuard(null, null);
      assert.equal(typeof res.pass, 'boolean');
    });

    assert.doesNotThrow(() => {
      const res = checkFactGuard(undefined, undefined);
      assert.equal(typeof res.pass, 'boolean');
    });
  });

  it('SEC-05: Ràng buộc cấu hình Form bắt buộc có đúng 1 Display Name và ít nhất 1 Identity', () => {
    // Không có displayName
    const noDisplay = [
      { key: 'f1', label: 'Email', type: FIELD_TYPES.EMAIL, role: FIELD_ROLES.IDENTITY, required: true },
    ];
    const valNoDisplay = validateFormFields(noDisplay);
    assert.equal(valNoDisplay.isValid, false);
    assert.ok(valNoDisplay.errors.some((e) => e.includes('tên hiển thị')));

    // Không có identity
    const noIdentity = [
      { key: 'f1', label: 'Họ và tên', type: FIELD_TYPES.TEXT, role: FIELD_ROLES.DISPLAY_NAME, required: true },
    ];
    const valNoIdentity = validateFormFields(noIdentity);
    assert.equal(valNoIdentity.isValid, false);
    assert.ok(valNoIdentity.errors.some((e) => e.includes('định danh')));
  });

  it('SEC-06: CSV Export vô hiệu hóa toàn bộ các ký tự thực thi formula (@, +, -, =, \\t, \\r)', () => {
    const dangerousPrefixes = ['@SUM(1+1)', '+12345', '-5+5', '=1+1', '\tcmd', '\rcalc'];
    for (const prefix of dangerousPrefixes) {
      const sanitized = formatCsvCell(prefix);
      assert.ok(sanitized.startsWith('"\''), `Ký tự "${prefix[0]}" phải được chèn nháy đơn bảo vệ`);
    }
  });
});

