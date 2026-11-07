import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateRegistrationCode,
  generateSlug,
  createDefaultFormFields,
  createProject,
  createRegistrationRecord,
  EVENT_FIELDS,
  normalizeEventInput,
  FIELD_ROLES,
  ASSET_ROLES,
} from '../src/domain/elsSchema.js';

import { createDefaultSampleAssets } from '../src/domain/sampleAssets.js';

import {
  validateProjectName,
  validateProjectInfo,
  validateFormFields,
  validateRegistrationSubmission,
} from '../src/domain/validators.js';

describe('6. ELS Domain: Schema & Generators', () => {
  it('generateRegistrationCode: sinh mã dạng DK-XXXXXX từ bảng chữ số chuẩn', () => {
    const code = generateRegistrationCode();
    assert.match(code, /^DK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  });

  it('generateSlug: sinh slug tiếng Việt không dấu kèm hậu tố', () => {
    const slug = generateSlug('Hội thảo Ứng dụng AI 2026');
    assert.ok(slug.startsWith('hoi-thao-ung-dung-ai-2026-'));
  });

  it('createDefaultFormFields: tạo đúng 3 trường mặc định tuân thủ bảo mật và không thu thập MSV thừa (Họ và tên, Email, Số điện thoại tùy chọn)', () => {
    const fields = createDefaultFormFields();
    assert.equal(fields.length, 3);
    assert.equal(fields[0].key, 'fld_name');
    assert.equal(fields[0].role, FIELD_ROLES.DISPLAY_NAME);
    assert.equal(fields[0].required, true);
    assert.equal(fields[1].key, 'fld_email');
    assert.equal(fields[1].role, FIELD_ROLES.IDENTITY);
    assert.equal(fields[1].required, true);
    assert.equal(fields[2].key, 'fld_phone');
    assert.equal(fields[2].required, false);
    // Đảm bảo không có trường MSV thừa
    assert.equal(fields.some(f => f.key === 'fld_msv'), false);
  });

  it('createProject: khởi tạo dự án với thông tin và trạng thái draft', () => {
    const p = createProject({ name: 'Dự án AI Mới', event: { description: 'Ghi chú thêm về sự kiện' } });
    assert.equal(p.name, 'Dự án AI Mới');
    assert.equal(p.status, 'draft');
    assert.ok(p.id.startsWith('prj_'));
    assert.equal(p.event.description, 'Ghi chú thêm về sự kiện');
  });

  it('createRegistrationRecord: tạo bản ghi đăng ký chuẩn hóa', () => {
    const reg = createRegistrationRecord({
      projectId: 'prj_123',
      values: { fld_name: 'Nguyễn Văn A' },
      displayName: 'Nguyễn Văn A',
      identityKey: 'a@example.com',
    });
    assert.equal(reg.displayName, 'Nguyễn Văn A');
    assert.equal(reg.identityKey, 'a@example.com');
    assert.match(reg.code, /^DK-/);
  });

  it('EVENT_FIELDS & normalizeEventInput: Single Source of Truth cho toàn bộ trường sự kiện (SYS-05)', () => {
    assert.equal(EVENT_FIELDS.NAME, 'eventName');
    assert.equal(EVENT_FIELDS.DATE, 'eventDate');
    assert.equal(EVENT_FIELDS.TIME, 'eventTime');
    assert.equal(EVENT_FIELDS.VENUE, 'venue');
    assert.equal(EVENT_FIELDS.SPEAKERS, 'speakers');
    assert.equal(EVENT_FIELDS.EARLY_BIRD, 'earlyBirdOffer');

    const rawLegacy = {
      name: '  Hội Thảo Công Nghệ Cao  ',
      date: '2026-12-15',
      time: '14:30',
      location: '  Hà Nội  ',
      speakers: 'Nguyễn Văn A, Trần Thị B',
      earlyBird: 'Giảm 25%',
    };
    const normalized = normalizeEventInput(rawLegacy);
    assert.equal(normalized.eventName, 'Hội Thảo Công Nghệ Cao');
    assert.equal(normalized.eventDate, '2026-12-15');
    assert.equal(normalized.eventTime, '14:30');
    assert.equal(normalized.venue, 'Hà Nội');
    assert.equal(normalized.earlyBirdOffer, 'Giảm 25%');
    assert.equal(normalized.speakers.length, 2);
    assert.equal(normalized.speakers[0].name, 'Nguyễn Văn A');
  });
});

describe('7. ELS Domain: Validators (FDD Quy tắc nghiệp vụ)', () => {
  it('validateProjectName: từ chối tên rỗng hoặc dưới 3 ký tự', () => {
    assert.equal(validateProjectName('  ').isValid, false);
    assert.equal(validateProjectName('AI').isValid, false);
    assert.equal(validateProjectName('Workshop Vibe Coding 2026').isValid, true);
  });

  it('validateProjectInfo: kiểm tra đủ 7 trường thông tin sự kiện', () => {
    const validData = {
      eventName: 'Workshop AI',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hội trường Grand Hall',
      speakers: [{ id: '1', name: 'TS. Nguyễn Văn A', title: 'Chuyên gia AI' }],
      earlyBirdOffer: 'Tặng Ebook 500k',
      agenda: [{ id: '1', time: '09:00', title: 'Check-in' }],
    };
    const res = validateProjectInfo(validData, []);
    assert.equal(res.isValid, true);

    // Thiếu diễn giả
    const noSpeaker = { ...validData, speakers: [] };
    assert.equal(validateProjectInfo(noSpeaker, []).isValid, false);

    // Ngày quá khứ
    const pastEvent = { ...validData, eventDate: '2020-01-01' };
    assert.equal(validateProjectInfo(pastEvent, []).isValid, false);
  });

  it('validateProjectInfo: kiểm tra mô tả ảnh nguồn (caption mandatory)', () => {
    const validData = {
      eventName: 'Workshop AI',
      eventDate: '2026-11-20',
      eventTime: '09:00',
      venue: 'Hội trường Grand Hall',
      speakers: [{ id: '1', name: 'TS. Nguyễn Văn A', title: 'Chuyên gia AI' }],
      earlyBirdOffer: 'Tặng Ebook 500k',
      agenda: [{ id: '1', time: '09:00', title: 'Check-in' }],
    };
    const badAssets = [{ id: 'img_1', dataUrl: 'data:...', caption: '  ' }];
    const res = validateProjectInfo(validData, badAssets);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.assets);
  });

  it('validateFormFields: kiểm tra đúng 1 displayName và ít nhất 1 identity', () => {
    const fields = createDefaultFormFields();
    const res = validateFormFields(fields);
    assert.equal(res.isValid, true);

    // Không có displayName
    const noDisplayName = fields.map((f) => ({ ...f, role: null }));
    assert.equal(validateFormFields(noDisplayName).isValid, false);

    // Không có identity
    const noIdentity = fields.map((f) => (f.role === FIELD_ROLES.IDENTITY ? { ...f, role: null } : f));
    assert.equal(validateFormFields(noIdentity).isValid, false);

    // Cảnh báo trường nhạy cảm
    const sensitive = [...fields, { key: 'fld_cccd', label: 'Số CCCD', type: 'text', required: true, role: null, deleted: false }];
    const warnRes = validateFormFields(sensitive);
    assert.ok(warnRes.warnings.length > 0);
  });

  it('validateRegistrationSubmission: kiểm tra định dạng và chống trùng lặp', () => {
    const fields = createDefaultFormFields();
    const existing = [
      { id: '1', identityKey: 'test@example.com', displayName: 'Người cũ' },
    ];

    // Trùng email định danh
    const duplicate = validateRegistrationSubmission(
      { fld_name: 'Người mới', fld_msv: '20201234', fld_email: 'TEST@example.com' },
      fields,
      existing
    );
    assert.equal(duplicate.isValid, false);
    assert.ok(duplicate.error.includes('đã đăng ký'));

    // Hợp lệ
    const validSub = validateRegistrationSubmission(
      { fld_name: 'Người mới', fld_msv: '20201234', fld_email: 'unique@example.com' },
      fields,
      existing
    );
    assert.equal(validSub.isValid, true);
    assert.equal(validSub.identityKey, 'unique@example.com');
  });

  it('createDefaultSampleAssets: sinh đầy đủ 6 ảnh mẫu AI kèm mô tả chi tiết và vai trò', () => {
    const speakerIds = ['spk_1', 'spk_2', 'spk_3'];
    const assets = createDefaultSampleAssets('proj_test_123', speakerIds);

    assert.equal(assets.length, 6, 'Phải sinh đúng 6 ảnh mẫu');
    
    // Kiểm tra từng ảnh đều có caption không rỗng
    for (const a of assets) {
      assert.ok(a.caption && a.caption.trim().length > 5, 'Mọi ảnh phải có mô tả caption rõ ràng');
      assert.equal(a.projectId, 'proj_test_123');
      assert.ok(a.dataUrl.length > 0);
    }

    // 3 ảnh diễn giả
    const speakerAssets = assets.filter((a) => a.role === ASSET_ROLES.SPEAKER);
    assert.equal(speakerAssets.length, 3);
    assert.equal(speakerAssets[0].speakerRef, 'spk_1');
    assert.equal(speakerAssets[1].speakerRef, 'spk_2');
    assert.equal(speakerAssets[2].speakerRef, 'spk_3');

    // 1 ảnh venue
    const venueAsset = assets.find((a) => a.role === ASSET_ROLES.VENUE);
    assert.ok(venueAsset);

    // 1 ảnh quà tặng/giải thưởng
    const giftAsset = assets.find((a) => a.role === ASSET_ROLES.GIFT);
    assert.ok(giftAsset);

    // 1 ảnh poster/other
    const posterAsset = assets.find((a) => a.role === ASSET_ROLES.OTHER);
    assert.ok(posterAsset);
  });
});
